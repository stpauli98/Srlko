import { useEffect, useRef } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet, useNavigate, useParams, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/stores/useAuthStore';
import { useChannelStore } from '@/stores/useChannelStore';
import { useMessageStore } from '@/stores/useMessageStore';
import { useDMStore } from '@/stores/useDMStore';
import { connectSocket, disconnectSocket, getSocket } from '@/lib/socket';
import { useHuddleStore, setHuddleUserId } from '@/stores/useHuddleStore';
import { useConnectionStore } from '@/stores/useConnectionStore';
import { HuddleBar } from '@/components/Huddle/HuddleBar';
import { HuddleIncomingCall } from '@/components/Huddle/HuddleIncomingCall';
import { AppLayout } from '@/components/Layout/AppLayout';
import { LoginPage } from '@/components/Auth/LoginPage';
import { RegisterPage } from '@/components/Auth/RegisterPage';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isHydrating } = useAuthStore();

  if (isHydrating) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-sm text-gray-500">Loading...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuthStore();

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}

/**
 * Syncs URL params to the channel store.
 * - /c/:channelId  → sets activeChannelId
 * - /d/:userId     → sets activeDMId
 */
function RouteSync() {
  const { channelId, userId } = useParams<{ channelId?: string; userId?: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const setActiveChannel = useChannelStore((s) => s.setActiveChannel);
  const setActiveDM = useChannelStore((s) => s.setActiveDM);
  const channels = useChannelStore((s) => s.channels);

  const channelsLoaded = channels.length > 0;

  useEffect(() => {
    if (channelId) {
      const id = parseInt(channelId, 10);
      if (isNaN(id) || id <= 0) return;
      const allChannels = useChannelStore.getState().channels;
      if (allChannels.length > 0 && !allChannels.find((ch) => ch.id === id)) {
        navigate('/', { replace: true });
        return;
      }
      const scrollRaw = (location.state as any)?.scrollToMessageId;
      const scrollToMessageId = typeof scrollRaw === 'number' && scrollRaw > 0 ? scrollRaw : undefined;
      setActiveChannel(id, scrollToMessageId);
    } else if (userId) {
      const id = parseInt(userId, 10);
      if (!isNaN(id) && id > 0) {
        const dmScrollRaw = (location.state as any)?.scrollToMessageId;
        const dmScrollToMessageId = typeof dmScrollRaw === 'number' && dmScrollRaw > 0 ? dmScrollRaw : undefined;
        setActiveDM(id, dmScrollToMessageId);
      }
    }
  }, [channelId, userId, setActiveChannel, setActiveDM, location.state, channelsLoaded, navigate]);

  return null;
}

function UnreadsRouteSync() {
  useEffect(() => {
    useChannelStore.setState({ activeChannelId: null, activeDMId: null });
  }, []);
  return null;
}

/**
 * Redirects / to /c/:id for the first available member channel.
 */
function DefaultRedirect() {
  const channels = useChannelStore((s) => s.channels);
  const isLoading = useChannelStore((s) => s.isLoading);
  const navigate = useNavigate();

  useEffect(() => {
    if (isLoading) return;
    const firstChannel = channels.find((ch) => ch.isMember);
    if (firstChannel) {
      navigate(`/c/${firstChannel.id}`, { replace: true });
    }
  }, [channels, isLoading, navigate]);

  return null;
}

function useFocusTracking() {
  const activeChannelId = useChannelStore((s) => s.activeChannelId);
  const activeDMId = useChannelStore((s) => s.activeDMId);
  const prevViewRef = useRef<{ type: string; id: number | null }>({ type: '', id: null });

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const viewType = activeChannelId ? 'channel' : activeDMId ? 'dm' : 'none';
    const viewId = activeChannelId || activeDMId || null;

    if (prevViewRef.current.type === viewType && prevViewRef.current.id === viewId) return;
    prevViewRef.current = { type: viewType, id: viewId };

    if (activeChannelId) {
      socket.emit('focus:channel', activeChannelId);
    } else if (activeDMId) {
      socket.emit('focus:dm', activeDMId);
    } else {
      socket.emit('focus:none');
    }
  }, [activeChannelId, activeDMId]);

  // Track tab visibility
  useEffect(() => {
    const handleVisibility = () => {
      const socket = getSocket();
      if (!socket) return;

      if (document.hidden) {
        socket.emit('focus:none');
      } else {
        const { activeChannelId, activeDMId } = useChannelStore.getState();
        if (activeChannelId) {
          socket.emit('focus:channel', activeChannelId);
        } else if (activeDMId) {
          socket.emit('focus:dm', activeDMId);
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, []);
}

function AppShell() {
  const fetchChannels = useChannelStore((s) => s.fetchChannels);
  const channels = useChannelStore((s) => s.channels);
  const joinedChannelsRef = useRef<Set<number>>(new Set());

  const fetchDirectMessages = useChannelStore((s) => s.fetchDirectMessages);

  useFocusTracking();

  useEffect(() => {
    fetchChannels();
    fetchDirectMessages();
  }, [fetchChannels, fetchDirectMessages]);

  // Connect socket and set up event listeners
  useEffect(() => {
    const socket = connectSocket();
    if (!socket) {
      console.warn('[AppShell] No socket connection — token may be missing');
      return;
    }

    const currentUserId = useAuthStore.getState().user?.id;
    if (currentUserId) setHuddleUserId(currentUserId);

    const handleConnect = () => {
      useAuthStore.getState().updateUser({ status: 'online' });
      useConnectionStore.getState().setConnected(true);
    };
    if (socket.connected) handleConnect();

    const handleNewMessage = (msg: import('@/lib/api').ApiMessage) => {
      const { onMessageNew } = useMessageStore.getState();
      const { activeChannelId, incrementUnread } = useChannelStore.getState();
      onMessageNew(msg);
      if (msg.channelId !== activeChannelId) {
        incrementUnread(msg.channelId);
      }
    };

    const handleUpdatedMessage = (msg: import('@/lib/api').ApiMessage) => {
      useMessageStore.getState().onMessageUpdated(msg);
    };

    const handleDeletedMessage = (data: { messageId: number }) => {
      useMessageStore.getState().onMessageDeleted(data);
    };

    const handleNewDM = (dm: import('@/lib/api').ApiDirectMessage) => {
      const { addOrUpdateDM, activeDMId, incrementDMUnread } = useChannelStore.getState();
      const currentUser = useAuthStore.getState().user;
      if (!currentUser) return;
      if (dm.fromUserId !== currentUser.id && dm.toUserId !== currentUser.id) return;
      if (typeof dm.fromUser?.id !== 'number' || typeof dm.toUser?.id !== 'number') return;
      if (typeof dm.fromUser?.name !== 'string' || typeof dm.toUser?.name !== 'string') return;
      const isSelfDM = dm.fromUserId === currentUser.id && dm.toUserId === currentUser.id;
      const isFromMe = dm.fromUserId === currentUser.id;
      const otherUser = isFromMe ? dm.toUser : dm.fromUser;
      const otherUserId = otherUser.id;
      if (!isSelfDM) {
        addOrUpdateDM(otherUserId, otherUser.name, otherUser.avatar ?? undefined);
      }
      if (activeDMId !== otherUserId && !isSelfDM) {
        incrementDMUnread(otherUserId);
      }
      useDMStore.getState().addIncomingMessage(dm, currentUser.id);
    };

    const handleDMUpdated = (dm: import('@/lib/api').ApiDirectMessage) => {
      const currentUser = useAuthStore.getState().user;
      if (!currentUser) return;
      useDMStore.getState().onDMUpdated(dm, currentUser.id);
    };

    const handleDMDeleted = (data: { dmId: number; fromUserId: number; toUserId: number }) => {
      const currentUser = useAuthStore.getState().user;
      if (!currentUser) return;
      useDMStore.getState().onDMDeleted(data, currentUser.id);
    };

    const handleDMReactionAdded = (data: { dmId: number; reaction: { emoji: string; userId: number; user: { name: string } } }) => {
      useDMStore.getState().onReactionAdded(data);
    };

    const handleDMReactionRemoved = (data: { dmId: number; emoji: string; userId: number }) => {
      useDMStore.getState().onReactionRemoved(data);
    };

    const handlePresenceUpdate = (data: { userId: number; status: string }) => {
      const { updateDMStatus } = useChannelStore.getState();
      updateDMStatus(data.userId, data.status as import('@/lib/types').DirectMessage['userStatus']);
      const currentUser = useAuthStore.getState().user;
      if (currentUser && data.userId === currentUser.id) {
        useAuthStore.getState().updateUser({ status: data.status as any });
      }
    };

    const handleMemberAdded = (data: { channelId: number; memberCount: number }) => {
      useChannelStore.getState().updateMemberCount(data.channelId, data.memberCount);
    };

    const handleMemberLeft = (data: { channelId: number; memberCount: number }) => {
      useChannelStore.getState().updateMemberCount(data.channelId, data.memberCount);
    };

    const handleChannelJoined = () => {
      useChannelStore.getState().fetchChannels();
    };

    const handleChannelDeleted = (data: { channelId: number }) => {
      useChannelStore.getState().fetchChannels();
      const msgStore = useMessageStore.getState();
      if (msgStore.loadedChannelId === data.channelId) {
        useMessageStore.setState({ messages: [], loadedChannelId: null });
      }
      const { activeChannelId } = useChannelStore.getState();
      if (activeChannelId === data.channelId) {
        useChannelStore.setState({ activeChannelId: null });
      }
    };

    const handleReactionAdded = (data: { messageId: number; reaction: { emoji: string; userId: number; user: { name: string } } }) => {
      useMessageStore.getState().onReactionAdded(data);
    };

    const handleReactionRemoved = (data: { messageId: number; emoji: string; userId: number }) => {
      useMessageStore.getState().onReactionRemoved(data);
    };

    socket.on('connect', handleConnect);
    socket.on('message:new', handleNewMessage);
    socket.on('message:updated', handleUpdatedMessage);
    socket.on('message:deleted', handleDeletedMessage);
    socket.on('dm:new', handleNewDM);
    socket.on('dm:updated', handleDMUpdated);
    socket.on('dm:deleted', handleDMDeleted);
    socket.on('dm:reaction:added', handleDMReactionAdded);
    socket.on('dm:reaction:removed', handleDMReactionRemoved);
    socket.on('presence:update', handlePresenceUpdate);
    socket.on('channel:member-added', handleMemberAdded);
    socket.on('channel:member-left', handleMemberLeft);
    socket.on('channel:joined', handleChannelJoined);
    socket.on('channel:deleted', handleChannelDeleted);
    socket.on('reaction:added', handleReactionAdded);
    socket.on('reaction:removed', handleReactionRemoved);

    // Huddle events
    const handleInviteSent = (data: { inviteId: string; toUserId: number }) =>
      useHuddleStore.getState().onInviteSent(data);
    const handleInviteReceived = (data: import('@/stores/useHuddleStore').IncomingInvite) =>
      useHuddleStore.getState().onInviteReceived(data);
    const handleInviteCancelled = (data: { inviteId: string; reason: string }) =>
      useHuddleStore.getState().onInviteCancelled(data);
    const handleHuddleConnected = (data: { huddleId: string; isInitiator: boolean; peer: { userId: number; name: string; avatar: string | null; isMuted: boolean } }) =>
      useHuddleStore.getState().onHuddleConnected(data);
    const handleHuddleSignal = (data: { huddleId: string; fromUserId: number; signal: { type: string; sdp?: string; candidate?: unknown } }) =>
      useHuddleStore.getState().onSignal(data);
    const handleHuddleMuteChanged = (data: { huddleId: string; userId: number; isMuted: boolean }) =>
      useHuddleStore.getState().onMuteChanged(data);
    const handleHuddleEnded = (data: { huddleId: string }) =>
      useHuddleStore.getState().onHuddleEnded(data);

    const handleHuddleError = (data: { message: string }) =>
      useHuddleStore.setState({ error: data.message });

    socket.on('huddle:invite:sent', handleInviteSent);
    socket.on('huddle:invite:received', handleInviteReceived);
    socket.on('huddle:invite:cancelled', handleInviteCancelled);
    socket.on('huddle:connected', handleHuddleConnected);
    socket.on('huddle:signal', handleHuddleSignal);
    socket.on('huddle:mute-changed', handleHuddleMuteChanged);
    socket.on('huddle:ended', handleHuddleEnded);
    socket.on('huddle:error', handleHuddleError);

    const handleDisconnect = () => {
      joinedChannelsRef.current.clear();
      useHuddleStore.getState().cleanup();
      useConnectionStore.getState().setConnected(false);
    };
    socket.on('disconnect', handleDisconnect);

    return () => {
      socket.off('connect', handleConnect);
      socket.off('message:new', handleNewMessage);
      socket.off('message:updated', handleUpdatedMessage);
      socket.off('message:deleted', handleDeletedMessage);
      socket.off('dm:new', handleNewDM);
      socket.off('dm:updated', handleDMUpdated);
      socket.off('dm:deleted', handleDMDeleted);
      socket.off('dm:reaction:added', handleDMReactionAdded);
      socket.off('dm:reaction:removed', handleDMReactionRemoved);
      socket.off('presence:update', handlePresenceUpdate);
      socket.off('channel:member-added', handleMemberAdded);
      socket.off('channel:member-left', handleMemberLeft);
      socket.off('channel:joined', handleChannelJoined);
      socket.off('channel:deleted', handleChannelDeleted);
      socket.off('reaction:added', handleReactionAdded);
      socket.off('reaction:removed', handleReactionRemoved);
      socket.off('huddle:invite:sent', handleInviteSent);
      socket.off('huddle:invite:received', handleInviteReceived);
      socket.off('huddle:invite:cancelled', handleInviteCancelled);
      socket.off('huddle:connected', handleHuddleConnected);
      socket.off('huddle:signal', handleHuddleSignal);
      socket.off('huddle:mute-changed', handleHuddleMuteChanged);
      socket.off('huddle:ended', handleHuddleEnded);
      socket.off('huddle:error', handleHuddleError);
      socket.off('disconnect', handleDisconnect);
      useHuddleStore.getState().cleanup();
      disconnectSocket();
    };
  }, []);

  // Join channel rooms as they become available
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const joinChannels = () => {
      for (const ch of channels) {
        if (ch.isMember && !joinedChannelsRef.current.has(ch.id)) {
          socket.emit('join:channel', ch.id);
          joinedChannelsRef.current.add(ch.id);
        }
      }
    };

    if (socket.connected) {
      joinChannels();
    }
    socket.on('connect', joinChannels);
    return () => {
      socket.off('connect', joinChannels);
    };
  }, [channels]);

  return (
    <>
      <Outlet />
      <AppLayout />
      <HuddleBar />
      <HuddleIncomingCall />
    </>
  );
}

function App() {
  const hydrate = useAuthStore((s) => s.hydrate);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/login"
          element={
            <PublicRoute>
              <LoginPage />
            </PublicRoute>
          }
        />
        <Route
          path="/register"
          element={
            <PublicRoute>
              <RegisterPage />
            </PublicRoute>
          }
        />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <AppShell />
            </ProtectedRoute>
          }
        >
          <Route index element={<DefaultRedirect />} />
          <Route path="c/:channelId" element={<RouteSync />} />
          <Route path="d/:userId" element={<RouteSync />} />
          <Route path="unreads" element={<UnreadsRouteSync />} />
          <Route path="*" element={<DefaultRedirect />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
