import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, MoreVertical, Paperclip, Send, Smile, ArrowLeft, Check, CheckCheck, User, Globe, MessageSquare } from 'lucide-react';
import { supabase } from '../supabaseClient';

const Messages = () => {
  const [searchParams] = useSearchParams();
  const initialContactId = searchParams.get('userId');
  const listingId = searchParams.get('listingId');
  const navigate = useNavigate();
  
  const [currentUser, setCurrentUser] = useState(null);
  const [activeContact, setActiveContact] = useState(null);
  const [message, setMessage] = useState('');
  const [contacts, setContacts] = useState([]);
  const [chatHistory, setChatHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const activeContactRef = useRef(null);
  const scrollContainerRef = useRef(null);

  const messagesEndRef = useRef(null);

  useEffect(() => {
    const initChat = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate('/login');
        return;
      }
      setCurrentUser(session.user);

      // If we have a userId in URL, it means we want to chat with someone specific
      if (initialContactId) {
        // Fetch that user's profile info
        const { data: profile } = await supabase
          .from('profiles')
          .select('id, full_name, avatar_url, role')
          .eq('id', initialContactId)
          .single();

        if (profile) {
          const newContact = {
            id: profile.id,
            name: profile.full_name || 'Guest User',
            avatar: profile.avatar_url,
            lastMsg: 'Starting a new conversation...',
            time: 'Now',
            online: true
          };
          setContacts([newContact]);
          setActiveContact(newContact);
          
          // Initial message simulate
          setChatHistory([{
            id: 'init',
            senderId: profile.id,
            text: `Hello! I'm interested in your ${listingId ? 'listing' : 'services'}.`,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            seen: true
          }]);
        }
      } else {
        // Fetch all real contacts
        fetchContacts();
      }
      setLoading(false);
    };

    initChat();
  }, [navigate, initialContactId]);

  useEffect(() => {
    if (activeContact) {
      activeContactRef.current = activeContact.id;
      fetchChatHistory(activeContact.id);
    } else {
      activeContactRef.current = null;
    }
  }, [activeContact]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!message.trim() || !activeContact || !currentUser) return;

    const newMessage = {
      sender_id: currentUser.id,
      receiver_id: activeContact.id,
      message: message.trim(),
    };

    const { data, error } = await supabase
      .from('messages')
      .insert([newMessage])
      .select();

    if (error) {
      console.error('Error sending message:', error);
      alert('Error sending message. Please make sure the "messages" table exists in your Supabase database.');
    } else {
      setMessage('');
      fetchChatHistory(activeContact.id);
    }
  };

  const fetchChatHistory = async (contactId) => {
    if (!currentUser || !contactId) return;
    
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .or(`sender_id.eq.${currentUser.id},receiver_id.eq.${currentUser.id}`)
      .order('created_at', { ascending: true });

    if (!error && data) {
      // Filter for current conversation only
      const filtered = data.filter(m => 
        (m.sender_id === currentUser.id && m.receiver_id === contactId) ||
        (m.sender_id === contactId && m.receiver_id === currentUser.id)
      );

      setChatHistory(filtered.map(m => ({
        id: m.id,
        senderId: m.sender_id === currentUser.id ? 'me' : m.sender_id,
        text: m.message,
        time: new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        seen: true
      })));
    }
  };

  const fetchContacts = async () => {
    if (!currentUser) return;
    
    try {
      // Fetch ALL messages involving me to get unique user IDs
      const { data: messages, error: msgErr } = await supabase
        .from('messages')
        .select('sender_id, receiver_id')
        .or(`sender_id.eq.${currentUser.id},receiver_id.eq.${currentUser.id}`);
      
      if (msgErr) throw msgErr;

      // Extract unique IDs of people I've chatted with
      const userIds = [
        ...new Set((messages || []).flatMap(m => [m.sender_id, m.receiver_id]))
      ].filter(id => id && id !== currentUser.id);

      // Fetch profiles for these users
      let profilesToShow = [];
      if (userIds.length > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, full_name, avatar_url')
          .in('id', userIds);
        profilesToShow = profiles || [];
      }

      // If still no contacts, suggest sellers (for buyers) or buyers (for sellers)
      if (profilesToShow.length === 0) {
        const { data: suggestions } = await supabase
          .from('profiles')
          .select('id, full_name, avatar_url')
          .limit(10);
        profilesToShow = suggestions?.filter(p => p.id !== currentUser.id) || [];
      }

      setContacts(profilesToShow.map(p => ({
        id: p.id,
        name: p.full_name || 'Acc Zone User',
        avatar: p.avatar_url,
        lastMsg: 'Click to start chatting',
        time: '',
        online: false
      })));
      
    } catch (err) {
      console.error('Fetch contacts error:', err);
    }
  };

  useEffect(() => {
    if (!currentUser) return;

    // Real-time subscription
    const channel = supabase
      .channel('messages_realtime')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages' },
        (payload) => {
          const { sender_id, receiver_id } = payload.new;
          // If message is for or from me
          if (sender_id === currentUser.id || receiver_id === currentUser.id) {
            // If it's for the currently open chat
            if (sender_id === activeContactRef.current || receiver_id === activeContactRef.current) {
              fetchChatHistory(activeContactRef.current);
            }
            // Always refresh contacts to show last message/new chats
            fetchContacts();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUser, activeContact, contacts]);

  if (!currentUser) return null;

  return (
    <div className="flex h-[calc(100vh-64px)] bg-[#0a0c12] overflow-hidden">
      {/* Sidebar - Contacts */}
      <div className={`w-full md:w-80 lg:w-96 border-r border-gray-800 flex flex-col bg-[#0d0f17] ${activeContact && 'hidden md:flex'}`}>
        <div className="p-4 border-b border-gray-800 sticky top-0 bg-[#0d0f17] z-10">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-white">Chats</h2>
            <div className="flex gap-2">
               <button className="p-2 hover:bg-gray-800 rounded-full text-gray-400"><MessageSquare className="w-5 h-5" /></button>
               <button className="p-2 hover:bg-gray-800 rounded-full text-gray-400"><MoreVertical className="w-5 h-5" /></button>
            </div>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input 
              type="text" 
              placeholder="Search or start new chat" 
              className="w-full bg-[#161a25] border-none rounded-xl py-2.5 pl-10 pr-4 text-sm text-gray-200 placeholder-gray-500 focus:ring-1 focus:ring-primary outline-none"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {contacts.map((contact) => (
            <div 
              key={contact.id}
              onClick={() => setActiveContact(contact)}
              className={`flex items-center gap-3 p-4 cursor-pointer transition-colors border-b border-gray-800/50 ${activeContact?.id === contact.id ? 'bg-primary/10 border-l-4 border-l-primary' : 'hover:bg-gray-800/30'}`}
            >
              <div className="relative shrink-0">
                <div className="w-12 h-12 rounded-full bg-gray-800 flex items-center justify-center border border-gray-700">
                  {contact.avatar ? <img src={contact.avatar} className="w-full h-full rounded-full object-cover" alt="" /> : <User className="w-6 h-6 text-gray-500" />}
                </div>
                {contact.online && <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-[#0d0f17]"></div>}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-center mb-0.5">
                  <h3 className="text-sm font-bold text-white truncate">{contact.name}</h3>
                  <span className="text-[10px] text-gray-500">{contact.time}</span>
                </div>
                <div className="flex justify-between items-center">
                  <p className="text-xs text-gray-400 truncate">{contact.lastMsg}</p>
                  {contact.unread > 0 && <span className="w-4 h-4 rounded-full bg-primary text-[#0d0f17] text-[10px] font-black flex items-center justify-center">{contact.unread}</span>}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Main Chat Area */}
      {activeContact ? (
        <div className="flex-1 flex flex-col relative bg-[url('https://w0.peakpx.com/wallpaper/508/606/HD-wallpaper-whatsapp-dark-mode-pattern-whatsapp-messenger-logo-brand-patterns-thumbnail.jpg')] bg-repeat bg-opacity-5">
           {/* Chat Header */}
           <div className="p-3 md:p-4 border-b border-gray-800 flex items-center justify-between sticky top-0 bg-[#0d0f17]/95 backdrop-blur-md z-10 w-full">
              <div className="flex items-center gap-3">
                <button onClick={() => setActiveContact(null)} className="md:hidden p-2 text-gray-400"><ArrowLeft className="w-5 h-5" /></button>
                <div className="relative">
                  <div className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center border border-gray-700">
                    {activeContact.avatar ? <img src={activeContact.avatar} className="w-full h-full rounded-full object-cover" alt="" /> : <User className="w-5 h-5 text-gray-500" />}
                  </div>
                  {activeContact.online && <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-[#0d0f17]"></div>}
                </div>
                <div>
                   <h2 className="text-sm font-bold text-white line-clamp-1">{activeContact.name}</h2>
                   <p className="text-[10px] text-gray-500 font-medium uppercase tracking-widest">{activeContact.online ? 'Online' : 'Offline'}</p>
                </div>
              </div>
              <div className="flex gap-1 md:gap-4">
                 <button className="p-2 hover:bg-gray-800 rounded-full text-gray-400"><Search className="w-5 h-5" /></button>
                 <button className="p-2 hover:bg-gray-800 rounded-full text-gray-400"><MoreVertical className="w-5 h-5" /></button>
              </div>
           </div>

           {/* Messages Container */}
           <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4">
              {chatHistory.map((msg) => (
                <div key={msg.id} className={`flex ${msg.senderId === 'me' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] md:max-w-[70%] group relative px-4 py-2.5 rounded-2xl shadow-xl ${msg.senderId === 'me' ? 'bg-primary text-black rounded-tr-none' : 'bg-gray-800/90 text-white border border-gray-700/50 rounded-tl-none backdrop-blur-md'}`}>
                    <p className="text-sm leading-relaxed">{msg.text}</p>
                    <div className={`flex items-center justify-end gap-1 mt-1 ${msg.senderId === 'me' ? 'text-black/60' : 'text-gray-500'}`}>
                       <span className="text-[10px] font-bold">{msg.time}</span>
                       {msg.senderId === 'me' && (
                         msg.seen ? <CheckCheck className="w-3 h-3" /> : <Check className="w-3 h-3" />
                       )}
                    </div>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
           </div>

           {/* Input Bar */}
           <div className="p-4 bg-[#0d0f17]/95 backdrop-blur-md border-t border-gray-800">
             <form onSubmit={handleSend} className="flex items-center gap-3 max-w-6xl mx-auto">
               <div className="flex gap-2">
                 <button type="button" className="p-2 text-gray-500 hover:text-white transition-colors"><Smile className="w-6 h-6" /></button>
                 <button type="button" className="p-2 text-gray-500 hover:text-white transition-colors"><Paperclip className="w-6 h-6" /></button>
               </div>
               <div className="flex-1 relative">
                 <input 
                    type="text" 
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Type a message..."
                    className="w-full bg-[#1c2230] border-none rounded-2xl py-3 px-4 text-sm text-gray-200 placeholder-gray-500 focus:ring-1 focus:ring-primary outline-none"
                 />
               </div>
               <button 
                 type="submit" 
                 disabled={!message.trim()}
                 className={`p-3 rounded-full transition-all ${message.trim() ? 'bg-primary text-black shadow-lg shadow-primary/20 scale-105' : 'bg-gray-800 text-gray-500'}`}
               >
                 <Send className="w-5 h-5" />
               </button>
             </form>
           </div>
        </div>
      ) : (
        <div className="hidden md:flex flex-1 flex-col items-center justify-center bg-[#0a0c12]">
            <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center mb-6 animate-pulse">
               <Globe className="w-12 h-12 text-primary" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Acc Zone Web</h2>
            <p className="text-gray-500 text-center max-w-md px-6">
              Send and receive messages without keeping your phone online. Use Acc Zone on up to 4 linked devices and 1 phone at the same time.
            </p>
            <div className="mt-12 flex items-center gap-2 text-xs text-gray-600 font-bold uppercase tracking-widest border-t border-gray-800 pt-8 w-full justify-center">
               <CheckCheck className="w-4 h-4" /> End-to-end encrypted
            </div>
        </div>
      )}
    </div>
  );
};

export default Messages;
