    import React, { useState, useEffect, useMemo, useCallback } from 'react';
    import { initializeApp } from 'firebase/app';
    import {
        getFirestore,
        collection,
        onSnapshot,
        addDoc,
        deleteDoc,
        doc,
        query,
        where,
        setLogLevel
    } from 'firebase/firestore';
    import { getAuth, signInAnonymously, onAuthStateChanged, User } from 'firebase/auth'; // Removed signInWithCustomToken
    import { QuerySnapshot, DocumentData, QueryDocumentSnapshot } from '@firebase/firestore';

    // --- Helper: Icon Components (using Lucide-React SVG paths for a cleaner look) ---
    const CalendarDaysIcon = ({ className }: { className?: string }) => (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
            <rect width="18" height="18" x="3" y="4" rx="2" ry="2"></rect><line x1="16" x2="16" y1="2" y2="6"></line><line x1="8" x2="8" y1="2" y2="6"></line><line x1="3" x2="21" y1="10" y2="10"></line>
        </svg>
    );
    const ChevronLeftIcon = ({ className }: { className?: string }) => (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
            <path d="m15 18-6-6 6-6"></path>
        </svg>
    );
    const ChevronRightIcon = ({ className }: { className?: string }) => (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
            <path d="m9 18 6-6-6-6"></path>
        </svg>
    );
    const Trash2Icon = ({ className }: { className?: string }) => (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
            <path d="M3 6h18"></path><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" x2="10" y1="11" y2="17"></line><line x1="14" x2="14" y1="11" y2="17"></line>
        </svg>
    );
    const BriefcaseIcon = ({ className }: { className?: string }) => ( // For Onboarding
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
            <rect width="20" height="14" x="2" y="7" rx="2" ry="2"></rect><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>
        </svg>
    );
    const RepeatIcon = ({ className }: { className?: string }) => ( // For Follow-up
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
            <path d="m17 2 4 4-4 4"></path><path d="M3 11v-1a4 4 0 0 1 4-4h14"></path><path d="m7 22-4-4 4-4"></path><path d="M21 13v1a4 4 0 0 1-4 4H3"></path>
        </svg>
    );

    // --- Firebase Configuration ---
    const firebaseConfig = {
        apiKey: "AIzaSyAQUvChCVgwaUfcoMtZLkMcv7YgDv30F7g",
        authDomain: "my-calendar-app-9d13c.firebaseapp.com",
        projectId: "my-calendar-app-9d13c",
        storageBucket: "my-calendar-app-9d13c.firebasestorage.app",
        messagingSenderId: "739348507913",
        appId: "1:739348507913:web:24aa5bb602306ab75737d8",
        measurementId: "G-X3YRMMEHRP"
    };

    const appId = firebaseConfig.projectId;

    // Initialize Firebase
    const app = initializeApp(firebaseConfig);
    const db = getFirestore(app);
    const auth = getAuth(app);
    setLogLevel('debug'); // Set Firebase log level to debug for more verbose output

    // --- Static Data ---
    const DUMMY_CLIENTS = [
        { id: '1', name: 'Sriram Iyer', phone: '123-456-7890' }, { id: '2', name: 'Shilpa Rao', phone: '234-567-8901' }, { id: '3', name: 'Rahul Sharma', phone: '345-678-9012' }, { id: '4', name: 'Priya Patel', phone: '456-789-0123' }, { id: '5', name: 'Amit Singh', phone: '567-890-1234' }, { id: '6', name: 'Anjali Gupta', phone: '678-901-2345' }, { id: '7', name: 'Vikram Kumar', phone: '789-012-3456' }, { id: '8', name: 'Sunita Reddy', phone: '890-123-4567' }, { id: '9', name: 'Rajesh Nair', phone: '901-234-5678' }, { id: '10', name: 'Kavita Desai', phone: '012-345-6789' }, { id: '11', name: 'Deepak Mehta', phone: '111-222-3333' }, { id: '12', name: 'Meera Joshi', phone: '222-333-4444' }, { id: '13', name: 'Sanjay Verma', phone: '333-444-5555' }, { id: '14', name: 'Pooja Chauhan', phone: '444-555-6666' }, { id: '15', name: 'Arun Pillai', phone: '555-666-7777' }, { id: '16', name: 'Geeta Krishnan', phone: '666-777-8888' }, { id: '17', name: 'Manoj Tiwari', phone: '777-888-9999' }, { id: '18', name: 'Ritu Agarwal', phone: '888-999-0000' }, { id: '19', name: 'Nitin Saxena', phone: '999-000-1111' }, { id: '20', name: 'Neha Khanna', phone: '000-111-2222' }
    ];

    // --- Type Definitions ---
    type CallType = 'onboarding' | 'follow-up';
    interface Booking {
        id: string;
        clientId: string;
        clientName: string;
        callType: CallType;
        duration: number; // in minutes (e.g., 20 or 40)
        isRecurring: boolean;
        time: string; // HH:mm (24-hour format, e.g., "10:30")
        date?: string; // YYYY-MM-DD for one-time bookings
        dayOfWeek?: number; // 0 (Sun) - 6 (Sat) for recurring bookings
        startDate?: string; // YYYY-MM-DD for recurring bookings (when it started)
    }

    // --- Helper Functions ---
    const generateTimeSlots = (): string[] => {
        const slots: string[] = [];
        const start = new Date();
        start.setHours(10, 30, 0, 0); // Start at 10:30 AM
        const end = new Date();
        end.setHours(19, 30, 0, 0); // End at 7:30 PM (19:30)

        let current = new Date(start);
        while (current.getTime() <= end.getTime()) {
            slots.push(current.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }));
            current.setMinutes(current.getMinutes() + 20);
        }
        return slots;
    };

    const formatDate = (date: Date): string => date.toISOString().split('T')[0];

    const time12to24 = (time12h: string): string => {
        const [time, modifier] = time12h.split(' ');
        let [hours, minutes] = time.split(':');
        if (hours === '12') {
            hours = (modifier === 'AM') ? '00' : '12';
        } else if (modifier === 'PM') {
            hours = String(parseInt(hours, 10) + 12);
        }
        return `${hours.padStart(2, '0')}:${minutes}`;
    };

    const formatTime24to12 = (time24h: string): string => {
        const [hours, minutes] = time24h.split(':').map(Number);
        const date = new Date();
        date.setHours(hours, minutes, 0, 0);
        return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
    };

    // --- Main App Component ---
    export default function App() {
        const [userId, setUserId] = useState<string | null>(null);
        const [isAuthReady, setIsAuthReady] = useState(false);
        const [selectedDate, setSelectedDate] = useState<Date>(new Date());
        const [dailyBookings, setDailyBookings] = useState<Booking[]>([]);
        const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
        const [isDeleteConfirmOpen, setDeleteConfirmOpen] = useState<boolean>(false);
        const [bookingToDelete, setBookingToDelete] = useState<Booking | null>(null);
        const [selectedTime, setSelectedTime] = useState<string | null>(null);
        const [loading, setLoading] = useState<boolean>(true);
        const [message, setMessage] = useState<{ type: 'success' | 'error' | ''; text: string }>({ type: '', text: '' });


        // Authentication
        useEffect(() => {
            const unsubscribe = onAuthStateChanged(auth, async (user: User | null) => {
                if (user) {
                    setUserId(user.uid);
                } else {
                    try {
                        await signInAnonymously(auth);
                    } catch (error: unknown) { // Changed to unknown
                        console.error("Authentication Error:", error);
                    }
                }
                setIsAuthReady(true);
            });
            return () => unsubscribe();
        }, []);

        // Fetching Bookings
        useEffect(() => {
            if (!isAuthReady || !userId) return;

            setLoading(true);
            const formattedDate = formatDate(selectedDate);
            const dayOfWeek = selectedDate.getDay();
            const bookingsCol = collection(db, `artifacts/${appId}/public/data/bookings`);

            const oneTimeQuery = query(bookingsCol, where("date", "==", formattedDate));

            const unsubOneTime = onSnapshot(oneTimeQuery, (oneTimeSnapshot: QuerySnapshot<DocumentData>) => {
                const oneTimeBookings: Booking[] = oneTimeSnapshot.docs.map((doc: QueryDocumentSnapshot<DocumentData>) => ({ id: doc.id, ...doc.data() } as Booking));

                const recurringQuery = query(bookingsCol, where("dayOfWeek", "==", dayOfWeek));

                const unsubRecurring = onSnapshot(recurringQuery, (recurringSnapshot: QuerySnapshot<DocumentData>) => {
                    const recurringBookings: Booking[] = recurringSnapshot.docs
                        .map((doc: QueryDocumentSnapshot<DocumentData>) => ({ id: doc.id, ...doc.data() } as Booking))
                        .filter((b: Booking) => {
                            const bookingStartDate = new Date(b.startDate + 'T00:00:00');
                            return selectedDate.getTime() >= bookingStartDate.getTime();
                        });

                    const allBookings: Booking[] = [...oneTimeBookings, ...recurringBookings];

                    const uniqueBookingsMap = new Map<string, Booking>();
                    allBookings.forEach(booking => {
                        uniqueBookingsMap.set(booking.time, booking);
                    });

                    setDailyBookings(Array.from(uniqueBookingsMap.values()));
                    setLoading(false);
                }, (error: unknown) => { // Changed to unknown
                    console.error("Error fetching recurring bookings:", error);
                    setLoading(false);
                });

                return () => unsubRecurring();
            }, (error: unknown) => { // Changed to unknown
                console.error("Error fetching one-time bookings:", error);
                setLoading(false);
            });

            return () => unsubOneTime();
        }, [isAuthReady, userId, selectedDate, appId]);

        const timeSlots = useMemo(() => generateTimeSlots(), []);

        const timeSlotMap = useMemo(() => {
            const map = new Map<string, Booking | null>();
            timeSlots.forEach(slot12h => map.set(slot12h, null));

            dailyBookings.forEach(booking => {
                const startTime12h = formatTime24to12(booking.time);
                const numSlots = booking.duration / 20;
                const startIndex = timeSlots.findIndex(t => t === startTime12h);

                if (startIndex !== -1) {
                    for (let i = 0; i < numSlots; i++) {
                        if (startIndex + i < timeSlots.length) {
                            map.set(timeSlots[startIndex + i], booking);
                        }
                    }
                }
            });
            return map;
        }, [dailyBookings, timeSlots]);

        const handleOpenModal = (time: string) => {
            setSelectedTime(time);
            setIsModalOpen(true);
            setMessage({ type: '', text: '' });
        };

        const handleOpenDeleteConfirm = (booking: Booking) => {
            setBookingToDelete(booking);
            setDeleteConfirmOpen(true);
            setMessage({ type: '', text: '' });
        };

        const handleDelete = async () => {
            if (!bookingToDelete) return;

            try {
                const bookingDocRef = doc(db, `artifacts/${appId}/public/data/bookings`, bookingToDelete.id);
                await deleteDoc(bookingDocRef);
                setMessage({ type: 'success', text: 'Booking deleted successfully!' });
            } catch (error: unknown) { // Changed to unknown
                console.error("Error deleting booking:", error);
                setMessage({ type: 'error', text: 'Failed to delete booking. Please try again.' });
            } finally {
                setDeleteConfirmOpen(false);
                setBookingToDelete(null);
            }
        };

        const changeDay = (amount: number) => {
            setSelectedDate(prev => {
                const newDate = new Date(prev);
                newDate.setDate(newDate.getDate() + amount);
                return newDate;
            });
        };

        return (
            <div className="bg-slate-50 min-h-screen font-sans text-slate-800 antialiased">
                <div className="container mx-auto p-4 sm:p-6 lg:p-8 max-w-7xl">
                    <Header
                        selectedDate={selectedDate}
                        onDateChange={(e) => setSelectedDate(new Date(e.target.value + 'T00:00:00'))}
                        onPrevDay={() => changeDay(-1)}
                        onNextDay={() => changeDay(1)}
                        userId={userId}
                    />
                    <main className="bg-white rounded-xl shadow-lg mt-6">
                        <div className="grid grid-cols-1 divide-y divide-slate-100">
                            {loading ? (
                                <SkeletonLoader />
                            ) : (
                                timeSlots.map(time => {
                                    const booking = timeSlotMap.get(time);
                                    const isStartOfBooking = booking && formatTime24to12(booking.time) === time;

                                    if (booking && !isStartOfBooking) {
                                      return null;
                                    }

                                    return (
                                        <TimeSlot
                                            key={time}
                                            time={time}
                                            booking={booking || null}
                                            onBook={() => handleOpenModal(time)}
                                            onDelete={() => booking && handleOpenDeleteConfirm(booking)}
                                        />
                                    );
                                })
                            )}
                            {!loading && timeSlots.length === 0 && (
                                <div className="p-4 text-center text-slate-500">No time slots configured.</div>
                            )}
                            {!loading && dailyBookings.length === 0 && timeSlots.length > 0 && (
                                <div className="p-4 text-center text-slate-500">No bookings for this day. Click a slot to add one!</div>
                            )}
                        </div>
                    </main>
                </div>
                {isModalOpen && selectedTime && (
                    <BookingModal
                        onClose={() => setIsModalOpen(false)}
                        selectedDate={selectedDate}
                        selectedTime={selectedTime}
                        dailyBookings={dailyBookings}
                        setMessage={setMessage}
                    />
                )}
                {isDeleteConfirmOpen && bookingToDelete && (
                    <ConfirmationModal
                        title="Delete Booking"
                        message={`Are you sure you want to delete the ${bookingToDelete.callType} call with ${bookingToDelete.clientName}?`}
                        onConfirm={handleDelete}
                        onCancel={() => setDeleteConfirmOpen(false)}
                    />
                )}
                {message.text && (
                    <Toast
                        message={message.text}
                        type={message.type}
                        onClose={() => setMessage({ type: '', text: '' })}
                    />
                )}
            </div>
        );
    }

    // --- UI Components ---

    function Header({ selectedDate, onDateChange, onPrevDay, onNextDay, userId }: {
        selectedDate: Date;
        onDateChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
        onPrevDay: () => void;
        onNextDay: () => void;
        userId: string | null;
    }) {
        return (
            <header className="flex flex-col sm:flex-row items-center justify-between p-4 bg-white rounded-xl shadow-lg">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">Coach's Daily Calendar</h1>
                    <p className="text-slate-500 mt-1">
                        {selectedDate.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                    </p>
                    {userId && (
                        <p className="text-xs text-slate-400 mt-1 break-all">User ID: {userId}</p>
                    )}
                </div>
                <div className="flex items-center gap-x-2 mt-4 sm:mt-0">
                    <button onClick={onPrevDay} className="p-2 rounded-md hover:bg-slate-200 transition-colors text-slate-500"><ChevronLeftIcon className="h-5 w-5"/></button>
                    <div className="relative">
                        <input
                            type="date"
                            value={formatDate(selectedDate)}
                            onChange={onDateChange}
                            className="bg-white border border-slate-300 rounded-md pl-10 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        />
                        <CalendarDaysIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400"/>
                    </div>
                    <button onClick={onNextDay} className="p-2 rounded-md hover:bg-slate-200 transition-colors text-slate-500"><ChevronRightIcon className="h-5 w-5"/></button>
                </div>
            </header>
        );
    }

    function TimeSlot({ time, booking, onBook, onDelete }: {
        time: string;
        booking: Booking | null;
        onBook: () => void;
        onDelete: () => void;
    }) {
        const slotHeightClass = booking ? (booking.duration === 40 ? 'h-36' : 'h-20') : 'h-20';
        const CallIcon = booking?.callType === 'onboarding' ? BriefcaseIcon : RepeatIcon;
        const colorClass = booking?.callType === 'onboarding' ? 'border-indigo-500 bg-indigo-50' : 'border-teal-500 bg-teal-50';
        const textColorClass = booking?.callType === 'onboarding' ? 'text-indigo-800' : 'text-teal-800';

        return (
            <div className={`group flex items-center p-3 transition-all duration-300 ${slotHeightClass}`}>
                <div className="w-24 text-sm font-medium text-slate-500 text-right pr-4">{time}</div>
                <div className="flex-1 h-full relative">
                    {booking ? (
                        <div className={`h-full w-full rounded-lg p-3 flex justify-between items-start text-sm border-l-4 ${colorClass}`}>
                            <div className="flex items-start">
                                <CallIcon className={`h-5 w-5 mr-3 mt-0.5 ${textColorClass}`} />
                                <div>
                                    <p className={`font-bold ${textColorClass}`}>{booking.callType.charAt(0).toUpperCase() + booking.callType.slice(1)} Call</p>
                                    <p className="text-slate-600">{booking.clientName}</p>
                                </div>
                            </div>
                            <button onClick={onDelete} className="opacity-0 group-hover:opacity-100 transition-opacity text-red-500 hover:text-red-700 p-1 rounded-full hover:bg-red-100">
                                <Trash2Icon className="h-4 w-4" />
                            </button>
                        </div>
                    ) : (
                        <button onClick={onBook} className="w-full h-full text-left text-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity flex items-center pl-4">
                            <span className="text-lg">+</span><span className="ml-2 text-sm font-medium">Book appointment</span>
                        </button>
                    )}
                </div>
            </div>
        );
    }

    function SkeletonLoader() {
        return (
            <>
                {[...Array(5)].map((_, i) => (
                    <div key={i} className="flex items-center p-3 h-20 animate-pulse">
                        <div className="w-24 text-right pr-4"><div className="h-4 bg-slate-200 rounded w-16 inline-block"></div></div>
                        <div className="flex-1 h-full bg-slate-100 rounded-lg"></div>
                    </div>
                ))}
            </>
        );
    }

    function BookingModal({ onClose, selectedDate, selectedTime, dailyBookings, setMessage }: {
        onClose: () => void;
        selectedDate: Date;
        selectedTime: string;
        dailyBookings: Booking[];
        setMessage: React.Dispatch<React.SetStateAction<{ type: 'success' | 'error' | ''; text: string }>>;
    }) {
        const [clientSearch, setClientSearch] = useState<string>('');
        const [selectedClient, setSelectedClient] = useState<typeof DUMMY_CLIENTS[0] | null>(null);
        const [callType, setCallType] = useState<CallType>('onboarding');
        const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

        const filteredClients = useMemo(() =>
            DUMMY_CLIENTS.filter(c =>
                c.name.toLowerCase().includes(clientSearch.toLowerCase()) ||
                c.phone.includes(clientSearch)
            ), [clientSearch]);

        const checkOverlap = useCallback((newBookingTime: Date, newBookingDuration: number): boolean => {
            const newBookingEndTime = new Date(newBookingTime.getTime() + newBookingDuration * 60000);

            for (const existing of dailyBookings) {
                const [exHours, exMinutes] = existing.time.split(':').map(Number);
                const existingStartTime = new Date(selectedDate);
                existingStartTime.setHours(exHours, exMinutes, 0, 0);

                const existingEndTime = new Date(existingStartTime.getTime() + existing.duration * 60000);

                if (newBookingTime < existingEndTime && newBookingEndTime > existingStartTime) {
                    return true;
                }
            }
            return false;
        }, [dailyBookings, selectedDate]);

        const handleSubmit = async (e: React.FormEvent) => {
            e.preventDefault();
            setMessage({ type: '', text: '' });
            if (!selectedClient) {
                setMessage({ type: 'error', text: "Please select a client from the list." });
                return;
            }

            setIsSubmitting(true);
            const duration = callType === 'onboarding' ? 40 : 20;
            const time24 = selectedTime ? time12to24(selectedTime) : ''; // Handle selectedTime possibly being null
            const newBookingDate = new Date(`${formatDate(selectedDate)}T${time24}`);

            if (checkOverlap(newBookingDate, duration)) {
                setMessage({ type: 'error', text: `This time slot overlaps with an existing appointment.` });
                setIsSubmitting(false);
                return;
            }

            const newBookingData: Omit<Booking, 'id'> = {
                clientId: selectedClient.id, clientName: selectedClient.name, callType, duration, time: time24,
                isRecurring: callType === 'follow-up',
                ...(callType === 'follow-up'
                    ? { dayOfWeek: selectedDate.getDay(), startDate: formatDate(selectedDate) }
                    : { date: formatDate(selectedDate) }
                ),
            };

            try {
                await addDoc(collection(db, `artifacts/${appId}/public/data/bookings`), newBookingData);
                setMessage({ type: 'success', text: 'Booking successful!' });
                onClose();
            } catch (err: unknown) { // Changed to unknown
                console.error("Error adding booking:", err);
                setMessage({ type: 'error', text: "Failed to save booking. Please try again." });
            } finally {
                setIsSubmitting(false);
            }
        };

        return (
            <div className="fixed inset-0 bg-black/60 flex justify-center items-center z-50 p-4" onClick={onClose}>
                <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-full overflow-y-auto" onClick={e => e.stopPropagation()}>
                    <div className="p-6 border-b border-slate-200">
                        <h2 className="text-xl font-bold text-slate-900">Book Appointment</h2>
                        <p className="text-sm text-slate-500 mt-1">
                            On {selectedDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })} at {selectedTime}
                        </p>
                    </div>
                    <form onSubmit={handleSubmit}>
                        <div className="p-6 space-y-6">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Client</label>
                                {selectedClient ? (
                                    <div className="flex items-center justify-between p-3 bg-slate-100 rounded-md">
                                        <p className="font-semibold text-slate-800">{selectedClient.name}</p>
                                        <button type="button" onClick={() => setSelectedClient(null)} className="text-sm font-medium text-indigo-600 hover:text-indigo-800">Change</button>
                                    </div>
                                ) : (
                                    <div>
                                        <input type="text" placeholder="Search by name or phone..." value={clientSearch} onChange={(e) => setClientSearch(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"/>
                                        <div className="mt-2 max-h-40 overflow-y-auto border border-slate-200 rounded-md">
                                            {filteredClients.length > 0 ? filteredClients.map(c => (
                                                <div key={c.id} onClick={() => { setSelectedClient(c); setClientSearch(''); }} className="p-3 hover:bg-slate-100 cursor-pointer border-b border-slate-100 last:border-b-0">
                                                    <p className="font-semibold text-sm text-slate-800">{c.name}</p>
                                                    <p className="text-xs text-slate-500">{c.phone}</p>
                                                </div>
                                            )) : <p className="p-3 text-sm text-slate-500">No clients found.</p>}
                                        </div>
                                    </div>
                                )}
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">Call Type</label>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <div onClick={() => setCallType('onboarding')} className={`p-4 border rounded-lg cursor-pointer transition-all ${callType === 'onboarding' ? 'bg-indigo-50 border-indigo-500 ring-2 ring-indigo-500' : 'hover:border-slate-400'}`}>
                                        <p className="font-semibold text-slate-800">Onboarding Call</p><p className="text-sm text-slate-500">40 minutes (one-time)</p>
                                    </div>
                                    <div onClick={() => setCallType('follow-up')} className={`p-4 border rounded-lg cursor-pointer transition-all ${callType === 'follow-up' ? 'bg-teal-50 border-teal-500 ring-2 ring-teal-500' : 'hover:border-slate-400'}`}>
                                        <p className="font-semibold text-slate-800">Follow-up Call</p><p className="text-sm text-slate-500">20 minutes (weekly)</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="p-4 bg-slate-50 flex justify-end gap-x-3">
                            <button type="button" onClick={onClose} className="px-4 py-2 bg-white border border-slate-300 rounded-md text-sm font-medium hover:bg-slate-100">Cancel</button>
                            <button type="submit" disabled={isSubmitting || !selectedClient} className="px-4 py-2 bg-indigo-600 text-white rounded-md text-sm font-medium hover:bg-indigo-700 disabled:bg-indigo-300">
                                {isSubmitting ? 'Booking...' : 'Confirm Booking'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        );
    }

    function ConfirmationModal({ title, message, onConfirm, onCancel }: {
        title: string;
        message: string;
        onConfirm: () => void;
        onCancel: () => void;
    }) {
        return (
            <div className="fixed inset-0 bg-black/60 flex justify-center items-center z-50 p-4" onClick={onCancel}>
                <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm" onClick={e => e.stopPropagation()}>
                    <div className="p-6">
                        <h3 className="text-lg font-bold text-slate-900">{title}</h3>
                        <p className="text-sm text-slate-600 mt-2">{message}</p>
                    </div>
                    <div className="p-4 bg-slate-50 flex justify-end gap-x-3">
                        <button onClick={onCancel} className="px-4 py-2 bg-white border border-slate-300 rounded-md text-sm font-medium hover:bg-slate-100">Cancel</button>
                        <button onClick={onConfirm} className="px-4 py-2 bg-red-600 text-white rounded-md text-sm font-medium hover:bg-red-700">Confirm</button>
                    </div>
                </div>
            </div>
        );
    }

    function Toast({ message, type, onClose }: { message: string; type: 'success' | 'error' | ''; onClose: () => void }) {
        useEffect(() => {
            if (message) {
                const timer = setTimeout(() => {
                    onClose();
                }, 3000);
                return () => clearTimeout(timer);
            }
        }, [message, onClose]);

        if (!message) return null;

        const bgColor = type === 'success' ? 'bg-green-500' : type === 'error' ? 'bg-red-500' : 'bg-gray-700';
        const icon = type === 'success' ? (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
        ) : type === 'error' ? (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
        ) : null;

        return (
            <div className={`fixed bottom-5 right-5 ${bgColor} text-white px-6 py-3 rounded-lg shadow-xl flex items-center animate-fade-in z-50`}>
                {icon}
                <span className="font-semibold">{message}</span>
                <button onClick={onClose} className="ml-4 text-white hover:text-gray-200">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>
        );
    }
    