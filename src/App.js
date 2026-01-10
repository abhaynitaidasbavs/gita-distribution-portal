import { db, auth, firebaseConfig } from './firebase';
import { onAuthStateChanged } from 'firebase/auth';

import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc,
  setDoc,
  getDoc,
  getDocs, 
  query, 
  where,
  onSnapshot,
  Timestamp,
  orderBy,
  runTransaction
} from 'firebase/firestore';
import { initializeApp, deleteApp } from 'firebase/app';
import { 
  signInWithEmailAndPassword,
  getAuth,
  signOut,
  createUserWithEmailAndPassword 
} from 'firebase/auth';
import React, { useState, useEffect } from 'react';
import { Search, Plus, Download, Users, BookOpen, DollarSign, Package, Bell, Edit2, Trash2, Eye, Filter, X, Check, AlertCircle, LogOut, Save, ChevronDown, ChevronUp, Trophy, MoreVertical, TrendingUp, TrendingDown, Clock, Calendar, Info } from 'lucide-react';

// Flag to enable/disable inline editing features
const ENABLE_INLINE_EDIT = false;

const ISSUE_ITEM_FIELDS = [
  { key: 'gitaTelugu', label: 'Gita Telugu' },
  { key: 'bookletTelugu', label: 'Booklet Telugu' },
  { key: 'gitaEnglish', label: 'Gita English' },
  { key: 'bookletEnglish', label: 'Booklet English' },
  { key: 'calendar', label: 'Calendar' },
  { key: 'chikki', label: 'Chikki' },
  { key: 'pamphlets', label: 'Pamphlets' }
];

const getIssueDateObject = (issue = {}) => {
  const dateValue = issue.issuedDate || issue.date || issue.timestamp || issue.createdAt;
  
  if (!dateValue) return null;
  
  if (typeof dateValue === 'string' || typeof dateValue === 'number') {
    const parsed = new Date(dateValue);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }
  
  if (typeof dateValue === 'object') {
    if (typeof dateValue.toDate === 'function') {
      try {
        return dateValue.toDate();
      } catch (error) {
        console.warn('Unable to parse Firestore timestamp:', error);
        return null;
      }
    }
    
    if ('seconds' in dateValue && 'nanoseconds' in dateValue) {
      const milliseconds = dateValue.seconds * 1000 + Math.floor(dateValue.nanoseconds / 1_000_000);
      return new Date(milliseconds);
    }
  }
  
  return null;
};

const buildIssueHistoryRows = (history = []) => {
  return history
    .slice()
    .sort((a, b) => {
      const dateA = getIssueDateObject(a)?.getTime() || 0;
      const dateB = getIssueDateObject(b)?.getTime() || 0;
      return dateB - dateA;
    })
    .flatMap(issue => {
      const dateObj = getIssueDateObject(issue);
      const dateLabel = dateObj ? dateObj.toLocaleDateString() : 'N/A';
      
      return ISSUE_ITEM_FIELDS
        .map(({ key, label }) => {
          const value = parseInt(issue[key], 10);
          if (!value) return null;
          
          return {
            dateLabel,
            itemLabel: label,
            count: value
          };
        })
        .filter(Boolean);
    });
};

const formatIssueHistoryEntries = (history = []) => {
  return history
    .slice()
    .sort((a, b) => {
      const dateA = getIssueDateObject(a)?.getTime() || 0;
      const dateB = getIssueDateObject(b)?.getTime() || 0;
      return dateB - dateA;
    })
    .map(issue => {
      const dateObj = getIssueDateObject(issue);
      const dateLabel = dateObj ? dateObj.toLocaleDateString() : 'N/A';
      
      const itemCounts = ISSUE_ITEM_FIELDS.reduce((acc, field) => {
        acc[field.key] = parseInt(issue[field.key], 10) || 0;
        return acc;
      }, {});
      
      return {
        dateLabel,
        ...itemCounts
      };
    });
};

onAuthStateChanged(auth, (user) => {
  if (user) {
    console.log('Logged in UID:', user.uid);
    console.log('Email:', user.email);
  }
});
const GitaDistributionPortal = () => {
  // Authentication state
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [loginForm, setLoginForm] = useState({ username: '', password: '' });

  // Initial data setup
  const [teams, setTeams] = useState([]);
  const [schools, setSchools] = useState([]);
  useEffect(() => {
  if (!isLoggedIn) return;
  
  // Real-time listener for schools
  const unsubscribe = onSnapshot(
    collection(db, 'schools'), 
    (snapshot) => {
      const schoolsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setSchools(schoolsData);
    }
  );
  return () => unsubscribe();
}, [isLoggedIn]);
  //Fetch teams in real time  
  useEffect(() => {
    if (!isLoggedIn) return;
    
    const unsubscribeTeams = onSnapshot(
      collection(db, 'teams'), 
      (snapshot) => {
        const teamsData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setTeams(teamsData);
      }
    );
  
  return () => unsubscribeTeams();
}, [isLoggedIn]);

  const [requirements, setRequirements] = useState([]);
  
  // Load pricing from localStorage on mount
  useEffect(() => {
    const savedPrice = localStorage.getItem('perSetPrice');
    if (savedPrice) {
      setPerSetPrice(parseInt(savedPrice));
    }
  }, []);

  // Fetch requirements in real-time
  useEffect(() => {
    if (!isLoggedIn) return;
    
    const unsubscribeRequirements = onSnapshot(
      collection(db, 'requirements'), 
      (snapshot) => {
        const requirementsData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setRequirements(requirementsData);
      }
    );
    
    return () => unsubscribeRequirements();
  }, [isLoggedIn]);

  // Fetch money settlements in real-time
  useEffect(() => {
    if (!isLoggedIn) return;
    
    const unsubscribeSettlements = onSnapshot(
      collection(db, 'moneySettlements'), 
      (snapshot) => {
        const settlementsData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setMoneySettlements(settlementsData);
      }
    );
    
    return () => unsubscribeSettlements();
  }, [isLoggedIn]);

  // Fetch expenses in real-time
  useEffect(() => {
    if (!isLoggedIn) return;
    
    const unsubscribeExpenses = onSnapshot(
      collection(db, 'expenses'), 
      (snapshot) => {
        const expensesData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setExpenses(expensesData);
      }
    );
    
    return () => unsubscribeExpenses();
  }, [isLoggedIn]);

  // Fetch bank submissions in real-time (admin only)
  useEffect(() => {
    if (!isLoggedIn || !currentUser || currentUser.role !== 'admin') return;
    
    const unsubscribeBankSubmissions = onSnapshot(
      collection(db, 'bankSubmissions'), 
      (snapshot) => {
        const submissionsData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setBankSubmissions(submissionsData);
      }
    );
    
    return () => unsubscribeBankSubmissions();
  }, [isLoggedIn, currentUser]);

  // Fetch admin account in real-time (admin only)
  useEffect(() => {
    if (!isLoggedIn || !currentUser || currentUser.role !== 'admin') return;
    
    const adminAccountRef = doc(db, 'adminAccount', 'main');
    const unsubscribeAdminAccount = onSnapshot(
      adminAccountRef,
      (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data();
          setAdminAccount({
            totalReceived: data.totalReceived || 0,
            totalExpenses: data.totalExpenses || 0,
            balance: (data.totalReceived || 0) - (data.totalExpenses || 0)
          });
        } else {
          // Initialize admin account if it doesn't exist
          setDoc(adminAccountRef, {
            totalReceived: 0,
            totalExpenses: 0,
            balance: 0
          });
          setAdminAccount({ totalReceived: 0, totalExpenses: 0, balance: 0 });
        }
      }
    );
    
    return () => unsubscribeAdminAccount();
  }, [isLoggedIn, currentUser]);

  // Fetch score sheets in real-time
  useEffect(() => {
    if (!isLoggedIn) return;
    
    const unsubscribeScoreSheets = onSnapshot(
      query(collection(db, 'scoreSheets'), orderBy('generatedDate', 'desc')),
      (snapshot) => {
        const scoreSheetsData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setScoreSheets(scoreSheetsData);
      }
    );
    
    return () => unsubscribeScoreSheets();
  }, [isLoggedIn]);

  // Fetch master inventory in real-time (admin only)
  useEffect(() => {
    if (!isLoggedIn || !currentUser || currentUser.role !== 'admin') return;
    
    const masterInventoryRef = doc(db, 'masterInventory', 'main');
    const unsubscribeMasterInventory = onSnapshot(
      masterInventoryRef,
      (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data();
          setMasterInventory({
            gitaTelugu: data.gitaTelugu || 0,
            gitaEnglish: data.gitaEnglish || 0,
            bookletTelugu: data.bookletTelugu || 0,
            bookletEnglish: data.bookletEnglish || 0,
            calendar: data.calendar || 0,
            chikki: data.chikki || 0,
            pamphlets: data.pamphlets || 0
          });
        } else {
          // Initialize master inventory if it doesn't exist
          setDoc(masterInventoryRef, {
            gitaTelugu: 0,
            gitaEnglish: 0,
            bookletTelugu: 0,
            bookletEnglish: 0,
            calendar: 0,
            chikki: 0,
            pamphlets: 0
          });
        }
      }
    );
    
    return () => unsubscribeMasterInventory();
  }, [isLoggedIn, currentUser]);

  // Fetch master inventory history and all team issue history (admin only)
  useEffect(() => {
    if (!isLoggedIn || !currentUser || currentUser.role !== 'admin') return;
    
    // Fetch master inventory additions history
    const unsubscribeMasterHistory = onSnapshot(
      collection(db, 'masterInventoryHistory'),
      (snapshot) => {
        const historyData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        // Also get all team issue history
        const allTeamIssues = teams.flatMap(team => {
          const issueHistory = team.issueHistory || [];
          return issueHistory.map(issue => ({
            id: `${team.id}-${issue.timestamp || Date.now()}`,
            ...issue,
            teamName: team.name,
            teamId: team.id,
            type: 'issued'
          }));
        });
        
        // Combine and sort by date
        const combinedHistory = [...historyData, ...allTeamIssues].sort((a, b) => {
          const dateA = a.date || a.issuedDate || a.timestamp || '';
          const dateB = b.date || b.issuedDate || b.timestamp || '';
          return new Date(dateB) - new Date(dateA);
        });
        
        setMasterInventoryHistory(combinedHistory);
      }
    );
    
    return () => unsubscribeMasterHistory();
  }, [isLoggedIn, currentUser, teams]);

  // Helper function to normalize activity values (handle legacy data)
  const normalizeActivity = (activity) => {
    if (!activity) return 'To Be Visited';
    // Map legacy values to new values
    if (activity === 'Pending') return 'Announcement Pending';
    if (activity === 'Completed') return 'Announced';
    return activity;
  };

  // Helper function to get activity value from school (handles both activity and announcementStatus fields)
  const getSchoolActivity = (school) => {
    const activity = school.activity || school.announcementStatus;
    return normalizeActivity(activity);
  };

  // UI State
  const [activeView, setActiveView] = useState('dashboard');
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState({ start: '', end: '' });
  const [selectedActivityTab, setSelectedActivityTab] = useState('To Be Visited');
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState('');
  const [editingItem, setEditingItem] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [moneySettlements, setMoneySettlements] = useState([]);
  // State for expand/collapse tables in money settlement tab
  const [isTeamSettlementSummaryCollapsed, setIsTeamSettlementSummaryCollapsed] = useState(true);
  const [isInventoryIssuanceHistoryCollapsed, setIsInventoryIssuanceHistoryCollapsed] = useState(true);
  const [isPendingSettlementRequestsCollapsed, setIsPendingSettlementRequestsCollapsed] = useState(true);
  // State for expand/collapse in inventory tab
  const [isInventoryIssuedSummaryCollapsed, setIsInventoryIssuedSummaryCollapsed] = useState(true);
  const [isInventoryManagementCollapsed, setIsInventoryManagementCollapsed] = useState(true);
  const [isInventoryTabIssuanceHistoryCollapsed, setIsInventoryTabIssuanceHistoryCollapsed] = useState(true);
  // State for undo functionality
  const [undoHistory, setUndoHistory] = useState([]); // Array of { schoolData, inventory, teamId, timestamp }
  const [canUndo, setCanUndo] = useState(false);
  // State for filters in Pending Settlement Requests
  const [settlementStatusFilter, setSettlementStatusFilter] = useState('all');
  const [settlementMethodFilter, setSettlementMethodFilter] = useState('all');
  // State for inline editing
  const [editingCell, setEditingCell] = useState(null); // { schoolId, field, value }
  const [editingCellValue, setEditingCellValue] = useState('');
  // State for row actions menu
  const [openActionMenu, setOpenActionMenu] = useState(null); // ID of the row with open menu
  // State for date range filter in Inventory Issuance History
  const [inventoryDateFilter, setInventoryDateFilter] = useState('all'); // 'all', 'recent', 'custom'
  const [inventoryDateRange, setInventoryDateRange] = useState({ start: '', end: '' });
  // State for Quick View modal
  const [quickViewSettlement, setQuickViewSettlement] = useState(null);
  const [settlementForm, setSettlementForm] = useState({
    amount: 0, paymentMethod: 'Cash', date: new Date().toISOString().split('T')[0], notes: '', teamId: ''
  });
  const [expenses, setExpenses] = useState([]);
  const [expenseForm, setExpenseForm] = useState({
    amount: 0, description: '', date: new Date().toISOString().split('T')[0], category: 'Other'
  });
  const [bankSubmissions, setBankSubmissions] = useState([]);
  const [bankSubmissionForm, setBankSubmissionForm] = useState({
    amount: 0, date: new Date().toISOString().split('T')[0], notes: ''
  });
  const [adminAccount, setAdminAccount] = useState({ totalReceived: 0, totalExpenses: 0, balance: 0 });
  const [scoreSheets, setScoreSheets] = useState([]);
  const [scoreGenerationDate, setScoreGenerationDate] = useState(new Date().toISOString().split('T')[0]);
  const [isGeneratingScores, setIsGeneratingScores] = useState(false);
  const [expandedScoreSheets, setExpandedScoreSheets] = useState(new Set());
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);

  // Form states
  const [schoolForm, setSchoolForm] = useState({
    areaName: '', schoolName: '', activity: 'To Be Visited',
    teluguSetsDistributed: 0, englishSetsDistributed: 0, 
    teluguSetsTakenBack: 0, englishSetsTakenBack: 0,
    teluguSetsIssued: 0, englishSetsIssued: 0, // Changed from "on hold" to "issued"
    freeSetsGiven: 0,
    moneyCollected: 0, perSetPrice: 200, 
    contact_person_1_name: '', contact_person_1_phone: '',
    contact_person_2_name: '', contact_person_2_phone: '',
    contact_person_3_name: '', contact_person_3_phone: '',
    email: '', notes: '', date: new Date().toISOString().split('T')[0],
    payments: [], // Array to track daily payments
    updates: [], // Array to track daily updates
    pamphlets: 0
  });

  // State for incremental updates in the update modal
  const [incrementalUpdate, setIncrementalUpdate] = useState({
    teluguSetsDistributed: 0,
    englishSetsDistributed: 0,
    teluguSetsTakenBack: 0,
    englishSetsTakenBack: 0,
    teluguSetsIssued: 0,
    englishSetsIssued: 0,
    freeSetsGiven: 0,
    moneyCollected: 0,
    date: new Date().toISOString().split('T')[0]
  });

  const [teamForm, setTeamForm] = useState({
    name: '', username: '', password: '', contact: '',
    inventory: {
      gitaTelugu: 0, gitaEnglish: 0,
      bookletTelugu: 0, bookletEnglish: 0,
      calendar: 0, chikki: 0, pamphlets: 0
    }
  });

  const [requirementForm, setRequirementForm] = useState({
    gitaTelugu: 0, gitaEnglish: 0,
    bookletTelugu: 0, bookletEnglish: 0,
    calendar: 0, chikki: 0,
    reason: ''
  });

  // Pricing and inventory issuance state
  const [perSetPrice, setPerSetPrice] = useState(200); // Default price
  const [issueInventoryForm, setIssueInventoryForm] = useState({
    teamId: '',
    gitaTelugu: 0, gitaEnglish: 0,
    bookletTelugu: 0, bookletEnglish: 0,
    calendar: 0, chikki: 0, pamphlets: 0,
    issuedDate: new Date().toISOString().split('T')[0],
    contactPerson: '',
    contactPhone: ''
  });

  // Master inventory state
  const [masterInventory, setMasterInventory] = useState({
    gitaTelugu: 0,
    gitaEnglish: 0,
    bookletTelugu: 0,
    bookletEnglish: 0,
    calendar: 0,
    chikki: 0,
    pamphlets: 0
  });
  const [masterInventoryHistory, setMasterInventoryHistory] = useState([]);
  const [addInventoryForm, setAddInventoryForm] = useState({
    gitaTelugu: 0,
    gitaEnglish: 0,
    bookletTelugu: 0,
    bookletEnglish: 0,
    calendar: 0,
    chikki: 0,
    pamphlets: 0,
    date: new Date().toISOString().split('T')[0],
    notes: ''
  });

  // Admin credentials
  const ADMIN = { username: 'admin', password: 'admin123', role: 'admin' };

  // Login handler
  const handleLogin = async (e) => {
  e.preventDefault(); // Add this parameter and prevent default
  
  // Access state values correctly
  const username = loginForm.username.trim();
  const password = loginForm.password.trim();
  const email = `${username}@gmail.com`;
  console.log('=== LOGIN DEBUG ===');
  console.log('Username entered:', username);
  console.log('Email generated:', email);
  console.log('Password length:', password.length);
  console.log('Auth object:', auth);
  console.log('==================');
  console.log('Attempting login with email:', email); // Debug log
  
  // Validate inputs
  if (!username || !password) {
    alert('Please enter both username and password');
    return;
  }
  
  try {
    // For simplicity, use email format: username@gmail.com
    //const email = `${username}@gmail.com`;
    //const email = `${username}@gmail.com`;
    console.log('=== LOGIN DEBUG ===');
    console.log('Username entered:', username);
    console.log('Email generated:', email);
    console.log('Password length:', password.length);
    console.log('Auth object:', auth);
    console.log('==================');
    console.log('Attempting login with email:', email); // Debug log
    
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const uid = userCredential.user.uid;
    // Fetch user role from Firestore
   // const userDoc = await getDocs(
     // query(collection(db, 'users'), where('username', '==', username))
    //);
    // Fetch user data directly by UID from teams collection (merged)
    const userDocRef = doc(db, 'teams', uid);
    const userDocSnap = await getDoc(userDocRef);
    
    if (userDocSnap.exists()) {
      const userData = userDocSnap.data();
      console.log('User data fetched:', userData);
      
      // Set current user with teamId
      const userWithTeamId = {
        ...userData,
        uid: uid,
        teamId: uid // The document ID IS the teamId
      };
      setCurrentUser({ ...userData, uid: uid, teamId: uid });
      setIsLoggedIn(true);
      
      if (userData.role === 'team') {
        setSelectedTeam(uid);
        console.log('Team user logged in, selectedTeam set to:', uid);
      }
    } else {
      alert('User data not found in database');
      await signOut(auth);
    }
  } catch (error) {
    console.error('Login error:', error.code, error.message);
    
    // Better error messages
    if (error.code === 'auth/user-not-found') {
      alert('User not found. Please check your username.');
    } else if (error.code === 'auth/wrong-password') {
      alert('Incorrect password. Please try again.');
    } else if (error.code === 'auth/invalid-email') {
      alert('Invalid username format.');
    } else {
      alert(`Login failed: ${error.message}`);
    }
  }
};

  const handleLogout = async () => {
  try {
    await signOut(auth);
    setIsLoggedIn(false);
    setCurrentUser(null);
    setLoginForm({ username: '', password: '' });
    setSelectedTeam(null);
  } catch (error) {
    console.error('Logout error:', error);
  }
};

  // CRUD operations
  const addSchool = async () => {
  try {
    console.log('=== SCHOOL CREATION DEBUG ===');
    console.log('Current user:', auth.currentUser);
    console.log('Current user UID:', auth.currentUser?.uid);
    console.log('Current user email:', auth.currentUser?.email);
    
    let teamId;
    
    // Determine teamId based on user role
    if (currentUser.role === 'admin') {
      teamId = selectedTeam;
      if (!teamId) {
        alert('Please select a team first');
        return;
      }
    } else {
      // For team users, use their UID as teamId
      teamId = auth.currentUser.uid;
      if (!teamId) {
        alert('Team ID not found. Please contact administrator.');
        return;
      }
    }
    
    console.log('Using teamId:', teamId);
    
    // Verify team document exists and get current inventory
    const teamDocRef = doc(db, 'teams', teamId);
    const teamDocSnap = await getDoc(teamDocRef);
    
    if (!teamDocSnap.exists()) {
      alert('Team document not found. Please contact administrator.');
      console.error('Team document does not exist for ID:', teamId);
      return;
    }
    
    const teamData = teamDocSnap.data();
    console.log('Team document data:', teamData);
    
    if (!teamData.inventory) {
      alert('Team inventory not initialized. Please contact administrator.');
      console.error('Team inventory is missing');
      return;
    }
    
    const currentInventory = teamData.inventory;
    console.log('Current inventory:', currentInventory);
    
    // Calculate what was distributed
    const teluguSetsIssued = parseInt(schoolForm.teluguSetsIssued || 0);
    const englishSetsIssued = parseInt(schoolForm.englishSetsIssued || 0);
    const freeSetsGiven = parseInt(schoolForm.freeSetsGiven || 0);
    
    // Calculate what was taken back
    const teluguSetsTakenBack = parseInt(schoolForm.teluguSetsTakenBack || 0);
    const englishSetsTakenBack = parseInt(schoolForm.englishSetsTakenBack || 0);
    
    // Net sets = issued - taken back
    const netTeluguSets = teluguSetsIssued - teluguSetsTakenBack;
    const netEnglishSets = englishSetsIssued - englishSetsTakenBack;
    
    // Total sets needing calendar and chikki
    const totalSetsNeeded = netTeluguSets + netEnglishSets + freeSetsGiven;
    
    console.log('Inventory calculation:');
    console.log('Telugu sets issued:', teluguSetsIssued);
    console.log('English sets issued:', englishSetsIssued);
    console.log('Free sets given:', freeSetsGiven);
    console.log('Telugu sets taken back:', teluguSetsTakenBack);
    console.log('English sets taken back:', englishSetsTakenBack);
    console.log('Net Telugu sets to deduct:', netTeluguSets);
    console.log('Net English sets to deduct:', netEnglishSets);
    console.log('Total sets needing accessories:', totalSetsNeeded);
    
    // Check if sufficient inventory exists and build warning message
    const warnings = [];
    
    if (netTeluguSets > 0) {
      if ((currentInventory.gitaTelugu || 0) < netTeluguSets) {
        warnings.push(`Gita Telugu: Available ${currentInventory.gitaTelugu || 0}, Required ${netTeluguSets}`);
      }
      if ((currentInventory.bookletTelugu || 0) < netTeluguSets) {
        warnings.push(`Booklet Telugu: Available ${currentInventory.bookletTelugu || 0}, Required ${netTeluguSets}`);
      }
    }
    
    if (netEnglishSets > 0) {
      if ((currentInventory.gitaEnglish || 0) < netEnglishSets) {
        warnings.push(`Gita English: Available ${currentInventory.gitaEnglish || 0}, Required ${netEnglishSets}`);
      }
      if ((currentInventory.bookletEnglish || 0) < netEnglishSets) {
        warnings.push(`Booklet English: Available ${currentInventory.bookletEnglish || 0}, Required ${netEnglishSets}`);
      }
    }
    
    if (totalSetsNeeded > 0) {
      if ((currentInventory.calendar || 0) < totalSetsNeeded) {
        warnings.push(`Calendar: Available ${currentInventory.calendar || 0}, Required ${totalSetsNeeded}`);
      }
      if ((currentInventory.chikki || 0) < totalSetsNeeded) {
        warnings.push(`Chikki: Available ${currentInventory.chikki || 0}, Required ${totalSetsNeeded}`);
      }
    }
    
    // Check pamphlets if specified
    const pamphletsIssued = parseInt(schoolForm.pamphlets || 0);
    if (pamphletsIssued > 0) {
      if ((currentInventory.pamphlets || 0) < pamphletsIssued) {
        warnings.push(`Pamphlets: Available ${currentInventory.pamphlets || 0}, Required ${pamphletsIssued}`);
      }
    }
    
    // Show warning if inventory is insufficient, but allow proceeding
    if (warnings.length > 0) {
      const warningMessage = `Warning: Insufficient inventory for the following items:\n\n${warnings.join('\n')}\n\nInventory count will go negative. Do you want to proceed?`;
      const proceed = window.confirm(warningMessage);
      if (!proceed) {
        return;
      }
    }
    
    // Calculate new inventory values (allow negative values)
    const newInventory = {
      gitaTelugu: (currentInventory.gitaTelugu || 0) - netTeluguSets,
      bookletTelugu: (currentInventory.bookletTelugu || 0) - netTeluguSets,
      gitaEnglish: (currentInventory.gitaEnglish || 0) - netEnglishSets,
      bookletEnglish: (currentInventory.bookletEnglish || 0) - netEnglishSets,
      calendar: (currentInventory.calendar || 0) - totalSetsNeeded,
      chikki: (currentInventory.chikki || 0) - totalSetsNeeded,
      pamphlets: (currentInventory.pamphlets || 0) - pamphletsIssued
    };
    
    console.log('New inventory will be:', newInventory);
    
    // Create school document
    const timestamp = new Date().toISOString();
    const newSchool = {
      teamId: teamId,
      ...schoolForm,
      activity: schoolForm.activity || 'To Be Visited', // Ensure activity is set
      moneySettled: false,
      createdAt: timestamp,
      lastUpdated: timestamp
    };
    // Remove legacy announcementStatus if present
    delete newSchool.announcementStatus;
    
    console.log('Creating school document:', newSchool);
    
    // Add school document
    await addDoc(collection(db, 'schools'), newSchool);
    console.log('School document created successfully');
    
    // Update team inventory
    console.log('Updating team inventory...');
    await updateDoc(teamDocRef, {
      inventory: newInventory
    });
    console.log('Inventory updated successfully');
    
    resetSchoolForm();
    setShowModal(false);
    alert('School added successfully and inventory updated!');
    
  } catch (error) {
    console.error('=== ERROR ADDING SCHOOL ===');
    console.error('Error object:', error);
    console.error('Error code:', error.code);
    console.error('Error message:', error.message);
    console.error('========================');
    
    if (error.code === 'permission-denied') {
      alert('Permission denied. You may not have access to update inventory. Please contact administrator.');
    } else {
      alert(`Error adding school: ${error.message}`);
    }
  }
};

 const updateSchool = async () => {
  try {
    console.log('=== UPDATE SCHOOL DEBUG ===');
    console.log('Editing item:', editingItem);
    console.log('New form data:', schoolForm);
    
    const schoolRef = doc(db, 'schools', editingItem.id);
    
    // Get the original school data
    const originalSchool = editingItem;
    const teamId = schoolForm.teamId || originalSchool.teamId;
    
    console.log('Team ID:', teamId);
    
    // Fetch current team inventory
    const teamDocRef = doc(db, 'teams', teamId);
    const teamDocSnap = await getDoc(teamDocRef);
    
    if (!teamDocSnap.exists()) {
      alert('Team document not found');
      return;
    }
    
    const teamData = teamDocSnap.data();
    if (!teamData.inventory) {
      alert('Team inventory not found');
      return;
    }
    
    const currentInventory = teamData.inventory;
    console.log('Current team inventory:', currentInventory);
    
    // SAVE STATE FOR UNDO - Save both school data and inventory before making changes
    const undoState = {
      schoolData: { ...originalSchool }, // Deep copy of original school data
      inventory: { ...currentInventory }, // Deep copy of current inventory
      teamId: teamId,
      timestamp: new Date().toISOString()
    };
    
    // Add to undo history
    setUndoHistory(prev => [...prev, undoState]);
    setCanUndo(true);
    
    // OLD VALUES (what was previously recorded)
    const oldTeluguIssued = parseInt(originalSchool.teluguSetsIssued || 0);
    const oldEnglishIssued = parseInt(originalSchool.englishSetsIssued || 0);
    const oldFreeSets = parseInt(originalSchool.freeSetsGiven || 0);
    const oldTeluguTakenBack = parseInt(originalSchool.teluguSetsTakenBack || 0);
    const oldEnglishTakenBack = parseInt(originalSchool.englishSetsTakenBack || 0);
    
    // Calculate OLD net distribution (what was deducted before)
    const oldNetTelugu = oldTeluguIssued - oldTeluguTakenBack;
    const oldNetEnglish = oldEnglishIssued - oldEnglishTakenBack;
    const oldTotalSets = oldNetTelugu + oldNetEnglish + oldFreeSets;
    
    console.log('OLD values:');
    console.log('  Telugu issued:', oldTeluguIssued, 'taken back:', oldTeluguTakenBack, 'net:', oldNetTelugu);
    console.log('  English issued:', oldEnglishIssued, 'taken back:', oldEnglishTakenBack, 'net:', oldNetEnglish);
    console.log('  Free sets:', oldFreeSets);
    console.log('  Old total sets:', oldTotalSets);
    
    // NEW VALUES (what user is updating to)
    const newTeluguIssued = parseInt(schoolForm.teluguSetsIssued || 0);
    const newEnglishIssued = parseInt(schoolForm.englishSetsIssued || 0);
    const newFreeSets = parseInt(schoolForm.freeSetsGiven || 0);
    const newTeluguTakenBack = parseInt(schoolForm.teluguSetsTakenBack || 0);
    const newEnglishTakenBack = parseInt(schoolForm.englishSetsTakenBack || 0);
    
    // Calculate NEW net distribution (what should be deducted now)
    const newNetTelugu = newTeluguIssued - newTeluguTakenBack;
    const newNetEnglish = newEnglishIssued - newEnglishTakenBack;
    const newTotalSets = newNetTelugu + newNetEnglish + newFreeSets;
    
    console.log('NEW values:');
    console.log('  Telugu issued:', newTeluguIssued, 'taken back:', newTeluguTakenBack, 'net:', newNetTelugu);
    console.log('  English issued:', newEnglishIssued, 'taken back:', newEnglishTakenBack, 'net:', newNetEnglish);
    console.log('  Free sets:', newFreeSets);
    console.log('  New total sets:', newTotalSets);
    
    // Calculate DELTA (difference between new and old)
    // Positive delta = need to deduct more from inventory
    // Negative delta = need to add back to inventory
    const deltaTelugu = newNetTelugu - oldNetTelugu;
    const deltaEnglish = newNetEnglish - oldNetEnglish;
    const deltaFree = newFreeSets - oldFreeSets;
    const deltaTotalSets = newTotalSets - oldTotalSets;
    
    console.log('DELTA (change):');
    console.log('  Telugu delta:', deltaTelugu);
    console.log('  English delta:', deltaEnglish);
    console.log('  Free sets delta:', deltaFree);
    console.log('  Total sets delta:', deltaTotalSets);
    
    // Calculate new inventory by applying the delta
    // If delta is positive, we deduct more (inventory decreases)
    // If delta is negative, we add back (inventory increases)
    const newInventory = {
      gitaTelugu: Number(currentInventory.gitaTelugu || 0) - deltaTelugu,
      bookletTelugu: Number(currentInventory.bookletTelugu || 0) - deltaTelugu,
      gitaEnglish: Number(currentInventory.gitaEnglish || 0) - deltaEnglish,
      bookletEnglish: Number(currentInventory.bookletEnglish || 0) - deltaEnglish,
      calendar: Number(currentInventory.calendar || 0) - deltaTotalSets,
      chikki: Number(currentInventory.chikki || 0) - deltaTotalSets
    };
    
    console.log('New inventory after delta:', newInventory);
    
    // Check for pamphlets delta
    const oldPamphlets = parseInt(originalSchool.pamphlets || 0);
    const newPamphlets = parseInt(schoolForm.pamphlets || 0);
    const deltaPamphlets = newPamphlets - oldPamphlets;
    newInventory.pamphlets = Number(currentInventory.pamphlets || 0) - deltaPamphlets;
    
    // Check if inventory would go negative and build warning message
    const warnings = [];
    
    if (newInventory.gitaTelugu < 0) {
      warnings.push(`Gita Telugu: Would result in ${newInventory.gitaTelugu}`);
    }
    if (newInventory.bookletTelugu < 0) {
      warnings.push(`Booklet Telugu: Would result in ${newInventory.bookletTelugu}`);
    }
    if (newInventory.gitaEnglish < 0) {
      warnings.push(`Gita English: Would result in ${newInventory.gitaEnglish}`);
    }
    if (newInventory.bookletEnglish < 0) {
      warnings.push(`Booklet English: Would result in ${newInventory.bookletEnglish}`);
    }
    if (newInventory.calendar < 0) {
      warnings.push(`Calendar: Would result in ${newInventory.calendar}`);
    }
    if (newInventory.chikki < 0) {
      warnings.push(`Chikki: Would result in ${newInventory.chikki}`);
    }
    if (newInventory.pamphlets < 0) {
      warnings.push(`Pamphlets: Would result in ${newInventory.pamphlets}`);
    }
    
    // Show warning if inventory would go negative, but allow proceeding
    if (warnings.length > 0) {
      const warningMessage = `Warning: Inventory would go negative for the following items:\n\n${warnings.join('\n')}\n\nDo you want to proceed?`;
      const proceed = window.confirm(warningMessage);
      if (!proceed) {
        // Remove the undo state we just added since user cancelled
        setUndoHistory(prev => {
          const newHistory = prev.slice(0, -1);
          setCanUndo(newHistory.length > 0);
          return newHistory;
        });
        return;
      }
    }
    
    // Update school document
    console.log('Updating school document...');
    const updateData = {
      ...schoolForm,
      activity: schoolForm.activity || getSchoolActivity(originalSchool), // Ensure activity is set, normalize legacy
      lastUpdated: new Date().toISOString()
    };
    // Remove legacy announcementStatus when updating
    delete updateData.announcementStatus;
    
    await updateDoc(schoolRef, updateData);
    console.log('School updated successfully');
    
    // Update team inventory
    console.log('Updating team inventory...');
    await updateDoc(teamDocRef, {
      inventory: newInventory
    });
    console.log('Inventory updated successfully');
    
    // Show success notification if activity changed
    const newActivity = updateData.activity;
    const oldActivity = getSchoolActivity(originalSchool);
    const activityChanged = newActivity !== oldActivity;
    
    resetSchoolForm();
    setEditingItem(null);
    setShowModal(false);
    
    if (activityChanged) {
      alert(`School updated successfully! Activity changed from "${oldActivity}" to "${newActivity}".`);
    } else {
      alert('School updated successfully and inventory adjusted!');
    }
    
  } catch (error) {
    console.error('=== ERROR UPDATING SCHOOL ===');
    console.error('Error object:', error);
    console.error('Error code:', error.code);
    console.error('Error message:', error.message);
    console.error('============================');
    
    // Remove the undo state if update failed
    setUndoHistory(prev => {
      const newHistory = prev.slice(0, -1);
      setCanUndo(newHistory.length > 0);
      return newHistory;
    });
    
    if (error.code === 'permission-denied') {
      alert('Permission denied. You may not have access to update this school or inventory.');
    } else {
      alert(`Error updating school: ${error.message}`);
    }
  }
};

// Undo function to restore previous state
const undoLastChange = async () => {
  if (undoHistory.length === 0) {
    alert('No changes to undo');
    return;
  }
  
  try {
    // Get the last undo state
    const lastUndoState = undoHistory[undoHistory.length - 1];
    
    // Confirm undo action
    const confirmUndo = window.confirm(
      `Are you sure you want to undo the last change?\n\n` +
      `This will restore:\n` +
      `- School data to its previous state\n` +
      `- Team inventory to its previous state\n\n` +
      `This action cannot be undone.`
    );
    
    if (!confirmUndo) {
      return;
    }
    
    // Restore school data
    const schoolRef = doc(db, 'schools', lastUndoState.schoolData.id);
    const schoolUpdateData = {
      ...lastUndoState.schoolData,
      lastUpdated: new Date().toISOString(),
      undoRestored: true // Flag to indicate this was restored from undo
    };
    // Remove id and other Firestore-specific fields that shouldn't be updated
    delete schoolUpdateData.id;
    
    await updateDoc(schoolRef, schoolUpdateData);
    console.log('School data restored from undo');
    
    // Restore inventory
    const teamDocRef = doc(db, 'teams', lastUndoState.teamId);
    await updateDoc(teamDocRef, {
      inventory: lastUndoState.inventory
    });
    console.log('Inventory restored from undo');
    
    // Remove from undo history
    setUndoHistory(prev => {
      const newHistory = prev.slice(0, -1);
      setCanUndo(newHistory.length > 0);
      return newHistory;
    });
    
    // Refresh the editing item if modal is still open
    if (editingItem && editingItem.id === lastUndoState.schoolData.id) {
      // Fetch updated school data
      const updatedSchoolSnap = await getDoc(schoolRef);
      if (updatedSchoolSnap.exists()) {
        const updatedSchool = {
          id: updatedSchoolSnap.id,
          ...updatedSchoolSnap.data()
        };
        setEditingItem(updatedSchool);
        
        // Update form with restored data
        const formData = {
          ...updatedSchool,
          activity: getSchoolActivity(updatedSchool),
          contact_person_1_name: updatedSchool.contact_person_1_name || updatedSchool.contactPerson || '',
          contact_person_1_phone: updatedSchool.contact_person_1_phone || updatedSchool.contactNumber || '',
          contact_person_2_name: updatedSchool.contact_person_2_name || '',
          contact_person_2_phone: updatedSchool.contact_person_2_phone || '',
          contact_person_3_name: updatedSchool.contact_person_3_name || '',
          contact_person_3_phone: updatedSchool.contact_person_3_phone || ''
        };
        setSchoolForm(formData);
      }
    }
    
    alert('Last change has been undone successfully!');
    
  } catch (error) {
    console.error('=== ERROR UNDOING CHANGE ===');
    console.error('Error object:', error);
    console.error('Error code:', error.code);
    console.error('Error message:', error.message);
    console.error('============================');
    
    alert(`Error undoing change: ${error.message}`);
  }
};

  const deleteSchool = async (id) => {
  if (window.confirm('Are you sure you want to delete this school entry?')) {
    try {
      await deleteDoc(doc(db, 'schools', id));
    } catch (error) {
      console.error('Error deleting school:', error);
      alert('Error deleting school. Please try again.');
    }
  }
};


const addTeam = async () => {
  try {
    if (!teamForm.name || !teamForm.username || !teamForm.password || !teamForm.contact) {
      alert('Please fill in all required fields (Name, Username, Password, Contact)');
      return;
    }
    
    const email = `${teamForm.username.toLowerCase().trim().replace(/\s+/g, '')}@gmail.com`;
    
    console.log('=== ADD TEAM DEBUG ===');
    console.log('Current admin user before:', auth.currentUser?.email);
    console.log('Current admin UID before:', auth.currentUser?.uid);
    console.log('Creating team with email:', email);
    console.log('=====================');
    
    // Store admin credentials before creating secondary app
    const adminUser = auth.currentUser;
    const adminEmail = adminUser.email;
    const adminUid = adminUser.uid;
    
    // Create a SECONDARY Firebase app instance for creating the user
    const secondaryApp = initializeApp(firebaseConfig, 'Secondary');
    const secondaryAuth = getAuth(secondaryApp);
    
    try {
      // Create user with the secondary auth instance
      const userCredential = await createUserWithEmailAndPassword(
        secondaryAuth, 
        email, 
        teamForm.password
      );
      const uid = userCredential.user.uid;
      
      console.log('New team user created with UID:', uid);
      
      // Sign out from secondary auth immediately
      await signOut(secondaryAuth);
      
      // Clean up secondary app
      await deleteApp(secondaryApp);
      
      console.log('Secondary app cleaned up');
      console.log('Main auth user after cleanup:', auth.currentUser?.email);
      
      // Verify admin is still logged in to main auth
      if (!auth.currentUser || auth.currentUser.uid !== adminUid) {
        console.error('Admin session was lost! Re-authenticating...');
        alert('Session error occurred. Please try again.');
        return;
      }
      
      // Prepare team data
      const teamData = {
        id: uid,
        name: teamForm.name,
        username: teamForm.username,
        contact: teamForm.contact,
        role: 'team',
        email: email,
        setsRemaining: 0,
        inventory: {
          gitaTelugu: parseInt(teamForm.inventory?.gitaTelugu) || 0,
          gitaEnglish: parseInt(teamForm.inventory?.gitaEnglish) || 0,
          bookletTelugu: parseInt(teamForm.inventory?.bookletTelugu) || 0,
          bookletEnglish: parseInt(teamForm.inventory?.bookletEnglish) || 0,
          calendar: parseInt(teamForm.inventory?.calendar) || 0,
          chikki: parseInt(teamForm.inventory?.chikki) || 0,
          pamphlets: parseInt(teamForm.inventory?.pamphlets) || 0
        },
        createdAt: new Date().toISOString()
      };
      
      console.log('=== FIRESTORE WRITE DEBUG ===');
      console.log('Current auth user:', auth.currentUser?.email);
      console.log('Current auth UID:', auth.currentUser?.uid);
      console.log('Team data to write:', teamData);
      console.log('Writing to path: teams/' + uid);
      console.log('============================');
      
      // Write to Firestore as admin
      await setDoc(doc(db, 'teams', uid), teamData);
      
      console.log('Team document created successfully');
      console.log('Admin still logged in:', auth.currentUser?.email);
      
      resetTeamForm();
      setShowModal(false);
      alert(`Team "${teamForm.name}" added successfully!`);
      
    } catch (innerError) {
      // Clean up secondary app if error occurs
      try {
        await signOut(secondaryAuth);
        await deleteApp(secondaryApp);
      } catch (cleanupError) {
        console.log('Cleanup error (can be ignored):', cleanupError);
      }
      throw innerError;
    }
    
  } catch (error) {
    console.error('=== ERROR ADDING TEAM ===');
    console.error('Error object:', error);
    console.error('Error code:', error.code);
    console.error('Error message:', error.message);
    console.error('========================');
    
    if (error.code === 'auth/email-already-in-use') {
      alert('This username is already taken. Please choose a different username.');
    } else if (error.code === 'auth/weak-password') {
      alert('Password should be at least 6 characters long.');
    } else if (error.code === 'permission-denied' || error.code === 'PERMISSION_DENIED') {
      alert('Permission denied. Make sure you are logged in as admin with email: admin@gmail.com');
    } else {
      alert(`Error adding team: ${error.message}`);
    }
  }
};
  const raiseRequirement = async () => {
    try {
      const newReq = {
        teamId: currentUser.teamId,
        teamName: currentUser.name,
        gitaTelugu: parseInt(requirementForm.gitaTelugu) || 0,
        gitaEnglish: parseInt(requirementForm.gitaEnglish) || 0,
        bookletTelugu: parseInt(requirementForm.bookletTelugu) || 0,
        bookletEnglish: parseInt(requirementForm.bookletEnglish) || 0,
        calendar: parseInt(requirementForm.calendar) || 0,
        chikki: parseInt(requirementForm.chikki) || 0,
        reason: requirementForm.reason,
        status: 'pending',
        date: new Date().toISOString().split('T')[0],
        createdAt: new Date().toISOString()
      };
      
      await addDoc(collection(db, 'requirements'), newReq);
      
      const totalSets = newReq.gitaTelugu + newReq.gitaEnglish;
      
      setNotifications([...notifications, {
        id: Date.now(),
        message: `${currentUser.name} raised requirement for ${totalSets} total items`,
        date: new Date().toISOString()
      }]);
      
      resetRequirementForm();
      setShowModal(false);
      alert('Requirement raised successfully!');
    } catch (error) {
      console.error('Error raising requirement:', error);
      alert('Error raising requirement. Please try again.');
    }
  };

  // Calculate money difference for a school
  const calculateMoneyDifference = (school) => {
    const totalIssuedSets = (school.teluguSetsIssued || 0) + (school.englishSetsIssued || 0);
    const totalTakenBack = (school.teluguSetsTakenBack || 0) + (school.englishSetsTakenBack || 0);
    const netIssuedSets = totalIssuedSets - totalTakenBack;
    const expectedAmount = netIssuedSets * (school.perSetPrice || 200);
    const actualAmount = school.moneyCollected || 0;
    
    return expectedAmount - actualAmount;
  };

  const updateTeamSets = async (teamId, newValue) => {
    try {
      const teamRef = doc(db, 'teams', teamId);
      await updateDoc(teamRef, {
        setsRemaining: parseInt(newValue) || 0
      });
    } catch (error) {
      console.error('Error updating team sets:', error);
      alert('Error updating sets. Please try again.');
    }
  };

  const updateTeamInventory = async (teamId, updatedInventory) => {
    try {
      const teamRef = doc(db, 'teams', teamId);
      await updateDoc(teamRef, {
        inventory: updatedInventory
      });
    } catch (error) {
      console.error('Error updating team inventory:', error);
      alert('Error updating inventory. Please try again.');
    }
  };

  // Issue inventory to team
  const issueInventoryToTeam = async () => {
    try {
      if (!issueInventoryForm.teamId) {
        alert('Please select a team');
        return;
      }
      
      const teamRef = doc(db, 'teams', issueInventoryForm.teamId);
      const teamSnap = await getDoc(teamRef);
      
      if (!teamSnap.exists()) {
        alert('Team not found');
        return;
      }
      
      // Parse issue values as integers to prevent string concatenation
      const parsedGitaTelugu = parseInt(issueInventoryForm.gitaTelugu) || 0;
      const parsedGitaEnglish = parseInt(issueInventoryForm.gitaEnglish) || 0;
      const parsedBookletTelugu = parseInt(issueInventoryForm.bookletTelugu) || 0;
      const parsedBookletEnglish = parseInt(issueInventoryForm.bookletEnglish) || 0;
      const parsedCalendar = parseInt(issueInventoryForm.calendar) || 0;
      const parsedChikki = parseInt(issueInventoryForm.chikki) || 0;
      const parsedPamphlets = parseInt(issueInventoryForm.pamphlets) || 0;

      // Check master inventory availability (admin only)
      if (currentUser.role === 'admin') {
        const masterInventoryRef = doc(db, 'masterInventory', 'main');
        const masterSnap = await getDoc(masterInventoryRef);
        
        if (masterSnap.exists()) {
          const masterData = masterSnap.data();
          
          // Check if master inventory has enough stock
          if ((masterData.gitaTelugu || 0) < parsedGitaTelugu ||
              (masterData.gitaEnglish || 0) < parsedGitaEnglish ||
              (masterData.bookletTelugu || 0) < parsedBookletTelugu ||
              (masterData.bookletEnglish || 0) < parsedBookletEnglish ||
              (masterData.calendar || 0) < parsedCalendar ||
              (masterData.chikki || 0) < parsedChikki ||
              (masterData.pamphlets || 0) < parsedPamphlets) {
            alert('Insufficient stock in master inventory. Please add inventory first.');
            return;
          }
          
          // Deduct from master inventory
          await updateDoc(masterInventoryRef, {
            gitaTelugu: (masterData.gitaTelugu || 0) - parsedGitaTelugu,
            gitaEnglish: (masterData.gitaEnglish || 0) - parsedGitaEnglish,
            bookletTelugu: (masterData.bookletTelugu || 0) - parsedBookletTelugu,
            bookletEnglish: (masterData.bookletEnglish || 0) - parsedBookletEnglish,
            calendar: (masterData.calendar || 0) - parsedCalendar,
            chikki: (masterData.chikki || 0) - parsedChikki,
            pamphlets: (masterData.pamphlets || 0) - parsedPamphlets
          });
        }
      }
      
      const currentInventory = teamSnap.data().inventory || {};
      const issueHistory = teamSnap.data().issueHistory || [];

      // Calculate new inventory
      const updatedInventory = {
        gitaTelugu: (currentInventory.gitaTelugu || 0) + parsedGitaTelugu,
        bookletTelugu: (currentInventory.bookletTelugu || 0) + parsedBookletTelugu,
        gitaEnglish: (currentInventory.gitaEnglish || 0) + parsedGitaEnglish,
        bookletEnglish: (currentInventory.bookletEnglish || 0) + parsedBookletEnglish,
        calendar: (currentInventory.calendar || 0) + parsedCalendar,
        chikki: (currentInventory.chikki || 0) + parsedChikki,
        pamphlets: (currentInventory.pamphlets || 0) + parsedPamphlets
      };
      
      // Calculate total sets
      const totalSets = parsedGitaTelugu + 
                        parsedGitaEnglish;
      
      // Add to issue history
      const newIssue = {
        ...issueInventoryForm,
        totalSets,
        timestamp: new Date().toISOString()
      };
      
      // Update team document
      await updateDoc(teamRef, {
        inventory: updatedInventory,
        issueHistory: [...issueHistory, newIssue]
      });
      
      alert(`Inventory issued successfully! Total items: ${totalSets}`);
      
      // Reset form
      setIssueInventoryForm({
        teamId: '',
        gitaTelugu: 0, gitaEnglish: 0,
        bookletTelugu: 0, bookletEnglish: 0,
        calendar: 0, chikki: 0, pamphlets: 0,
        issuedDate: new Date().toISOString().split('T')[0],
        contactPerson: '',
        contactPhone: ''
      });
      setShowModal(false);
    } catch (error) {
      console.error('Error issuing inventory:', error);
      alert('Error issuing inventory. Please try again.');
    }
  };

  // Delete inventory issuance
  const deleteInventoryIssuance = async (teamId, issue) => {
    if (currentUser.role !== 'admin') {
      alert('You must be an admin to perform this action');
      return;
    }

    if (!window.confirm('Are you sure you want to delete this inventory issuance? This will restore the items to master inventory and deduct from the team inventory.')) {
      return;
    }

    try {
      const teamRef = doc(db, 'teams', teamId);
      const teamSnap = await getDoc(teamRef);
      
      if (!teamSnap.exists()) {
        alert('Team not found');
        return;
      }

      const teamData = teamSnap.data();
      const currentInventory = teamData.inventory || {};
      const issueHistory = teamData.issueHistory || [];

      // Parse issue values (handle both string and number types for backward compatibility)
      const parsedGitaTelugu = parseInt(issue.gitaTelugu) || 0;
      const parsedGitaEnglish = parseInt(issue.gitaEnglish) || 0;
      const parsedBookletTelugu = parseInt(issue.bookletTelugu) || 0;
      const parsedBookletEnglish = parseInt(issue.bookletEnglish) || 0;
      const parsedCalendar = parseInt(issue.calendar) || 0;
      const parsedChikki = parseInt(issue.chikki) || 0;
      const parsedPamphlets = parseInt(issue.pamphlets) || 0;

      // Find and remove the issue from history
      // Use timestamp if available, otherwise match by all fields for backward compatibility
      const updatedHistory = issueHistory.filter(historyItem => {
        // If both have timestamps, compare by timestamp
        if (issue.timestamp && historyItem.timestamp) {
          return historyItem.timestamp !== issue.timestamp;
        }
        // For old data without timestamps, compare by all fields
        return !(
          historyItem.issuedDate === issue.issuedDate &&
          (parseInt(historyItem.gitaTelugu) || 0) === parsedGitaTelugu &&
          (parseInt(historyItem.gitaEnglish) || 0) === parsedGitaEnglish &&
          (parseInt(historyItem.bookletTelugu) || 0) === parsedBookletTelugu &&
          (parseInt(historyItem.bookletEnglish) || 0) === parsedBookletEnglish &&
          (parseInt(historyItem.calendar) || 0) === parsedCalendar &&
          (parseInt(historyItem.chikki) || 0) === parsedChikki &&
          (parseInt(historyItem.pamphlets) || 0) === parsedPamphlets &&
          (historyItem.contactPerson || '') === (issue.contactPerson || '') &&
          (historyItem.contactPhone || '') === (issue.contactPhone || '')
        );
      });

      // Check if we actually found and removed the issue
      if (updatedHistory.length === issueHistory.length) {
        alert('Could not find the issue to delete. It may have already been deleted.');
        return;
      }

      // Deduct from team inventory (ensure non-negative values)
      const updatedInventory = {
        gitaTelugu: Math.max(0, (currentInventory.gitaTelugu || 0) - parsedGitaTelugu),
        gitaEnglish: Math.max(0, (currentInventory.gitaEnglish || 0) - parsedGitaEnglish),
        bookletTelugu: Math.max(0, (currentInventory.bookletTelugu || 0) - parsedBookletTelugu),
        bookletEnglish: Math.max(0, (currentInventory.bookletEnglish || 0) - parsedBookletEnglish),
        calendar: Math.max(0, (currentInventory.calendar || 0) - parsedCalendar),
        chikki: Math.max(0, (currentInventory.chikki || 0) - parsedChikki),
        pamphlets: Math.max(0, (currentInventory.pamphlets || 0) - parsedPamphlets)
      };

      // Add back to master inventory
      const masterInventoryRef = doc(db, 'masterInventory', 'main');
      const masterSnap = await getDoc(masterInventoryRef);
      
      if (masterSnap.exists()) {
        const masterData = masterSnap.data();
        await updateDoc(masterInventoryRef, {
          gitaTelugu: (masterData.gitaTelugu || 0) + parsedGitaTelugu,
          gitaEnglish: (masterData.gitaEnglish || 0) + parsedGitaEnglish,
          bookletTelugu: (masterData.bookletTelugu || 0) + parsedBookletTelugu,
          bookletEnglish: (masterData.bookletEnglish || 0) + parsedBookletEnglish,
          calendar: (masterData.calendar || 0) + parsedCalendar,
          chikki: (masterData.chikki || 0) + parsedChikki,
          pamphlets: (masterData.pamphlets || 0) + parsedPamphlets
        });
      }

      // Update team document
      await updateDoc(teamRef, {
        inventory: updatedInventory,
        issueHistory: updatedHistory
      });

      alert('Inventory issuance deleted successfully! Master inventory restored and team inventory adjusted.');
    } catch (error) {
      console.error('Error deleting inventory issuance:', error);
      alert('Error deleting inventory issuance. Please try again.');
    }
  };

  // Update pricing per set
  const updatePerSetPrice = async (newPrice) => {
    try {
      setPerSetPrice(newPrice);
      // Store in localStorage or in a config document
      localStorage.setItem('perSetPrice', newPrice);
      alert('Price per set updated successfully!');
    } catch (error) {
      console.error('Error updating price:', error);
      alert('Error updating price. Please try again.');
    }
  };

  // Add inventory to master inventory
  const addInventoryToMaster = async () => {
    try {
      const parsedGitaTelugu = parseInt(addInventoryForm.gitaTelugu) || 0;
      const parsedGitaEnglish = parseInt(addInventoryForm.gitaEnglish) || 0;
      const parsedBookletTelugu = parseInt(addInventoryForm.bookletTelugu) || 0;
      const parsedBookletEnglish = parseInt(addInventoryForm.bookletEnglish) || 0;
      const parsedCalendar = parseInt(addInventoryForm.calendar) || 0;
      const parsedChikki = parseInt(addInventoryForm.chikki) || 0;
      const parsedPamphlets = parseInt(addInventoryForm.pamphlets) || 0;

      // Check if at least one item is being added
      if (parsedGitaTelugu === 0 && parsedGitaEnglish === 0 && 
          parsedBookletTelugu === 0 && parsedBookletEnglish === 0 &&
          parsedCalendar === 0 && parsedChikki === 0 && parsedPamphlets === 0) {
        alert('Please enter at least one inventory item to add');
        return;
      }

      const masterInventoryRef = doc(db, 'masterInventory', 'main');
      const masterSnap = await getDoc(masterInventoryRef);
      
      let currentMaster = {
        gitaTelugu: 0,
        gitaEnglish: 0,
        bookletTelugu: 0,
        bookletEnglish: 0,
        calendar: 0,
        chikki: 0,
        pamphlets: 0
      };

      if (masterSnap.exists()) {
        currentMaster = masterSnap.data();
      }

      // Add to master inventory
      await updateDoc(masterInventoryRef, {
        gitaTelugu: (currentMaster.gitaTelugu || 0) + parsedGitaTelugu,
        gitaEnglish: (currentMaster.gitaEnglish || 0) + parsedGitaEnglish,
        bookletTelugu: (currentMaster.bookletTelugu || 0) + parsedBookletTelugu,
        bookletEnglish: (currentMaster.bookletEnglish || 0) + parsedBookletEnglish,
        calendar: (currentMaster.calendar || 0) + parsedCalendar,
        chikki: (currentMaster.chikki || 0) + parsedChikki,
        pamphlets: (currentMaster.pamphlets || 0) + parsedPamphlets
      });

      // Record the addition in master inventory history
      const masterHistoryRef = collection(db, 'masterInventoryHistory');
      await addDoc(masterHistoryRef, {
        gitaTelugu: parsedGitaTelugu,
        gitaEnglish: parsedGitaEnglish,
        bookletTelugu: parsedBookletTelugu,
        bookletEnglish: parsedBookletEnglish,
        calendar: parsedCalendar,
        chikki: parsedChikki,
        pamphlets: parsedPamphlets,
        date: addInventoryForm.date,
        notes: addInventoryForm.notes || '',
        timestamp: new Date().toISOString(),
        type: 'added'
      });

      alert('Inventory added to master inventory successfully!');
      
      // Reset form
      setAddInventoryForm({
        gitaTelugu: 0,
        gitaEnglish: 0,
        bookletTelugu: 0,
        bookletEnglish: 0,
        calendar: 0,
        chikki: 0,
        pamphlets: 0,
        date: new Date().toISOString().split('T')[0],
        notes: ''
      });
      setShowModal(false);
    } catch (error) {
      console.error('Error adding inventory:', error);
      alert('Error adding inventory. Please try again.');
    }
  };

  // Calculate aggregate stock (total accumulated inventory from all additions)
  const calculateAggregateStock = () => {
    return masterInventoryHistory
      .filter(item => item.type === 'added')
      .reduce((aggregate, item) => ({
        gitaTelugu: aggregate.gitaTelugu + (parseInt(item.gitaTelugu) || 0),
        gitaEnglish: aggregate.gitaEnglish + (parseInt(item.gitaEnglish) || 0),
        bookletTelugu: aggregate.bookletTelugu + (parseInt(item.bookletTelugu) || 0),
        bookletEnglish: aggregate.bookletEnglish + (parseInt(item.bookletEnglish) || 0),
        calendar: aggregate.calendar + (parseInt(item.calendar) || 0),
        chikki: aggregate.chikki + (parseInt(item.chikki) || 0),
        pamphlets: aggregate.pamphlets + (parseInt(item.pamphlets) || 0)
      }), {
        gitaTelugu: 0,
        gitaEnglish: 0,
        bookletTelugu: 0,
        bookletEnglish: 0,
        calendar: 0,
        chikki: 0,
        pamphlets: 0
      });
  };

  // Calculate total sets given to team
  const calculateTotalSetsGiven = (team) => {
    const issueHistory = team.issueHistory || [];
    return issueHistory.reduce((sum, issue) => sum + (issue.totalSets || 0), 0);
  };

  // Calculate settlement difference for a team
  const calculateTeamSettlementDifference = (teamId) => {
    const teamSchools = schools.filter(s => s.teamId === teamId);
    const totalCollected = teamSchools.reduce((sum, s) => sum + parseFloat(s.moneyCollected || 0), 0);
    const totalSettled = teamSchools.filter(s => s.moneySettled).reduce((sum, s) => sum + parseFloat(s.moneyCollected || 0), 0);

    // Calculate expected amount as total sets issued * global price.
    // Use the team's issueHistory totalSets (which is gitaTelugu + gitaEnglish per issue) as the authoritative source.
    const team = teams.find(t => t.id === teamId) || {};
    const issueHistory = team.issueHistory || [];
    const totalIssuedItems = issueHistory.reduce((sum, issue) => {
      const totalSets = parseInt(issue.totalSets || 0);
      return sum + (isNaN(totalSets) ? 0 : totalSets);
    }, 0);

    const pricePerSet = Number(perSetPrice) > 0 ? Number(perSetPrice) : 200;
    const expectedAmount = totalIssuedItems * pricePerSet;

    const difference = expectedAmount - totalSettled;
    return { totalCollected, totalSettled, expectedAmount, difference };
  };

  // Calculate total inventory items issued to a team
  const getTeamIssuedInventory = (team) => {
    const issueHistory = team.issueHistory || [];
    let totalItems = 0;
    
    issueHistory.forEach(issue => {
      totalItems += parseInt(issue.gitaTelugu || 0) + 
                    parseInt(issue.gitaEnglish || 0);
    });
    
    return totalItems;
  };

  // Get money settlement summary for all teams
  const getMoneySettlementSummary = () => {
    return teams.map(team => {
      const totalInventoryIssued = getTeamIssuedInventory(team);
      const teamSchools = schools.filter(s => s.teamId === team.id);
      
      // Calculate expected settlement using total sets issued * global price
      const expectedSettlement = totalInventoryIssued * (Number(perSetPrice) > 0 ? Number(perSetPrice) : 200);

      const totalMoneySettled = parseInt(team.totalMoneySettled || 0);
      const totalExpenses = getTotalTeamExpenses(team.id);
      
      return {
        teamId: team.id,
        teamName: team.name,
        totalInventoryIssued,
        expectedSettlement,
        totalMoneySettled,
        totalExpenses,
        balance: expectedSettlement - totalMoneySettled
      };
    });
  };

  const toggleMoneySettled = async (schoolId) => {
    try {
      const school = schools.find(s => s.id === schoolId);
      const schoolRef = doc(db, 'schools', schoolId);
      await updateDoc(schoolRef, {
        moneySettled: !school.moneySettled
      });
    } catch (error) {
      console.error('Error updating money settled status:', error);
      alert('Error updating status. Please try again.');
    }
  };

  // Calculate summary stats for Money Settlement tab
  const getSettlementSummaryStats = () => {
    const summary = getMoneySettlementSummary();
    const totalExpected = summary.reduce((sum, s) => sum + s.expectedSettlement, 0);
    const totalSettled = summary.reduce((sum, s) => sum + s.totalMoneySettled, 0);
    const pendingCount = moneySettlements.filter(s => s.status === 'pending').length;
    const pendingAmount = moneySettlements
      .filter(s => s.status === 'pending')
      .reduce((sum, s) => sum + (s.amount || 0), 0);
    
    return { totalExpected, totalSettled, pendingCount, pendingAmount };
  };

  // Calculate time ago for settlements
  const getTimeAgo = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return `${Math.floor(diffDays / 30)} months ago`;
  };

  // Get color based on balance (gradient from red to green)
  const getBalanceColor = (balance, maxBalance) => {
    if (balance < 0) return 'text-red-700 bg-red-50';
    if (balance === 0) return 'text-gray-700 bg-gray-50';
    
    const ratio = Math.min(balance / maxBalance, 1);
    if (ratio < 0.3) return 'text-orange-700 bg-orange-50';
    if (ratio < 0.7) return 'text-yellow-700 bg-yellow-50';
    return 'text-green-700 bg-green-50';
  };

  // Inline edit functions
  const startInlineEdit = (schoolId, field, currentValue) => {
    setEditingCell({ schoolId, field });
    setEditingCellValue(currentValue);
  };

  const cancelInlineEdit = () => {
    setEditingCell(null);
    setEditingCellValue('');
  };

  const saveInlineEdit = async () => {
    if (!editingCell) return;
    
    const { schoolId, field } = editingCell;
    const school = schools.find(s => s.id === schoolId);
    const oldValue = school[field];
    const newValue = field === 'schoolName' || field === 'areaName' || field === 'activity' 
      ? editingCellValue 
      : parseFloat(editingCellValue) || 0;

    // Don't save if value hasn't changed
    if (oldValue === newValue) {
      cancelInlineEdit();
      return;
    }

    try {
      const schoolRef = doc(db, 'schools', schoolId);
      
      // Create history entry
      const historyEntry = {
        field: field,
        oldValue: oldValue,
        newValue: newValue,
        delta: typeof newValue === 'number' && typeof oldValue === 'number' ? newValue - oldValue : null,
        editedBy: currentUser.email,
        editedByName: currentUser.name,
        editedAt: new Date().toISOString(),
        editType: 'inline_edit'
      };

      // Update school with new value and history
      await updateDoc(schoolRef, {
        [field]: newValue,
        editHistory: [...(school.editHistory || []), historyEntry],
        lastUpdated: new Date().toISOString()
      });

      cancelInlineEdit();
    } catch (error) {
      console.error('Error saving inline edit:', error);
      alert('Error saving changes. Please try again.');
    }
  };

  const handleInlineEditKeyPress = (e) => {
    if (e.key === 'Enter') {
      saveInlineEdit();
    } else if (e.key === 'Escape') {
      cancelInlineEdit();
    }
  };

  const approveRequirement = async (reqId) => {
    try {
      const reqRef = doc(db, 'requirements', reqId);
      await updateDoc(reqRef, {
        status: 'approved',
        approvedAt: new Date().toISOString()
      });
      alert('Requirement approved!');
    } catch (error) {
      console.error('Error approving requirement:', error);
      alert('Error approving requirement. Please try again.');
    }
  };

  // Money collection tracking
  const addMoneyCollection = async (schoolId, paymentData) => {
    try {
      const schoolRef = doc(db, 'schools', schoolId);
      const school = schools.find(s => s.id === schoolId);
      
      const newPayment = {
        id: `payment_${Date.now()}`,
        amount: parseFloat(paymentData.amount),
        method: paymentData.method,
        date: paymentData.date,
        timestamp: new Date().toISOString()
      };

      const updatedPayments = [...(school.payments || []), newPayment];
      const totalCollected = updatedPayments.reduce((sum, p) => sum + p.amount, 0);

      await updateDoc(schoolRef, {
        payments: updatedPayments,
        moneyCollected: totalCollected,
        updates: [...(school.updates || []), {
          type: 'money_collection',
          data: newPayment,
          timestamp: new Date().toISOString(),
          updatedBy: currentUser.uid
        }]
      });

      alert('Money collection recorded successfully!');
    } catch (error) {
      console.error('Error recording money collection:', error);
      alert('Error recording money collection. Please try again.');
    }
  };

  // Money settlement management
  const submitMoneySettlement = async () => {
    try {
      // For admin: use selected teamId from form, for team: use currentUser.teamId
      const selectedTeamId = currentUser.role === 'admin' ? settlementForm.teamId : currentUser.teamId;
      const selectedTeam = teams.find(t => t.id === selectedTeamId);
      
      if (!selectedTeamId || !selectedTeam) {
        alert('Please select a team');
        return;
      }

      const settlementData = {
        teamId: selectedTeamId,
        teamName: selectedTeam.name,
        amount: parseFloat(settlementForm.amount),
        paymentMethod: settlementForm.paymentMethod,
        date: settlementForm.date,
        notes: settlementForm.notes,
        status: 'pending',
        submittedAt: new Date().toISOString(),
        submittedBy: currentUser.role === 'admin' ? 'admin' : 'team',
        submittedByName: currentUser.name
      };

      await addDoc(collection(db, 'moneySettlements'), settlementData);
      
      resetSettlementForm();
      setShowModal(false);
      alert('Money settlement submitted for approval!');
    } catch (error) {
      console.error('Error submitting settlement:', error);
      alert('Error submitting settlement. Please try again.');
    }
  };

  const approveMoneySettlement = async (settlementId) => {
    try {
      const settlementRef = doc(db, 'moneySettlements', settlementId);
      const settlementSnap = await getDoc(settlementRef);
      
      if (!settlementSnap.exists()) {
        alert('Settlement not found');
        return;
      }

      const settlementData = settlementSnap.data();
      
      // Check if already approved to prevent double-approval
      if (settlementData.status === 'approved') {
        alert('This settlement has already been approved!');
        return;
      }
      
      // Use Firestore transaction to ensure atomic updates
      await runTransaction(db, async (transaction) => {
        // Update settlement status
        transaction.update(settlementRef, {
          status: 'approved',
          approvedAt: new Date().toISOString(),
          approvedBy: currentUser.uid
        });

        // Update team's total money settled atomically
        if (settlementData.teamId) {
          const teamRef = doc(db, 'teams', settlementData.teamId);
          const teamSnap = await transaction.get(teamRef);
          
          if (teamSnap.exists()) {
            const currentTotalSettled = (teamSnap.data().totalMoneySettled || 0);
            transaction.update(teamRef, {
              totalMoneySettled: currentTotalSettled + parseFloat(settlementData.amount)
            });
          }
        }

        // Update admin account atomically
        const adminAccountRef = doc(db, 'adminAccount', 'main');
        const adminAccountSnap = await transaction.get(adminAccountRef);
        
        if (adminAccountSnap.exists()) {
          const currentData = adminAccountSnap.data();
          const newTotalReceived = (currentData.totalReceived || 0) + parseFloat(settlementData.amount);
          transaction.update(adminAccountRef, {
            totalReceived: newTotalReceived,
            balance: newTotalReceived - (currentData.totalExpenses || 0)
          });
        } else {
          transaction.set(adminAccountRef, {
            totalReceived: parseFloat(settlementData.amount),
            totalExpenses: 0,
            balance: parseFloat(settlementData.amount)
          });
        }
      });

      alert('Money settlement approved successfully!');
    } catch (error) {
      console.error('Error approving settlement:', error);
      alert('Error approving settlement: ' + error.message);
    }
  };

  const declineMoneySettlement = async (settlementId) => {
    try {
      const settlementRef = doc(db, 'moneySettlements', settlementId);
      const settlementSnap = await getDoc(settlementRef);
      
      if (!settlementSnap.exists()) {
        alert('Settlement not found');
        return;
      }

      // Update settlement status to declined
      await updateDoc(settlementRef, {
        status: 'declined',
        declinedAt: new Date().toISOString(),
        declinedBy: currentUser.uid
      });

      alert('Money settlement declined!');
    } catch (error) {
      console.error('Error declining settlement:', error);
      alert('Error declining settlement. Please try again.');
    }
  };

  // Reconcile team settlement totals
  const reconcileTeamSettlements = async () => {
    if (!window.confirm('This will analyze all team settlement totals by comparing approved settlements with database values.\n\nContinue with analysis?')) {
      return;
    }

    try {
      const discrepancies = [];

      // For each team, calculate the sum of approved settlements
      for (const team of teams) {
        const approvedSettlements = moneySettlements.filter(
          s => s.teamId === team.id && s.status === 'approved'
        );
        
        const calculatedTotal = approvedSettlements.reduce(
          (sum, s) => sum + parseFloat(s.amount || 0), 
          0
        );
        
        const currentTotal = parseFloat(team.totalMoneySettled || 0);
        
        if (calculatedTotal !== currentTotal) {
          discrepancies.push({
            teamName: team.name,
            teamId: team.id,
            currentTotal,
            calculatedTotal,
            difference: calculatedTotal - currentTotal,
            approvedCount: approvedSettlements.length
          });
        }
      }

      if (discrepancies.length === 0) {
        alert('✅ ANALYSIS COMPLETE\n\nAll team settlement totals are correct!\nNo discrepancies found.\n\nDatabase is in sync with approved settlements.');
        return;
      }

      // Show detailed discrepancy report
      const totalDiscrepancy = discrepancies.reduce((sum, d) => sum + Math.abs(d.difference), 0);
      const header = `⚠️ DISCREPANCIES FOUND\n\nFound ${discrepancies.length} team(s) with incorrect settlement totals.\nTotal discrepancy amount: ₹${totalDiscrepancy.toLocaleString()}\n\n`;
      
      const discrepancyDetails = discrepancies.map((d, idx) => {
        const status = d.difference > 0 ? '📈 UNDERCOUNTED' : '📉 OVERCOUNTED';
        return `${idx + 1}. ${d.teamName} (${d.approvedCount} approved settlements)
   ${status}
   Current in Database: ₹${d.currentTotal.toLocaleString()}
   Correct Total:       ₹${d.calculatedTotal.toLocaleString()}
   Adjustment Needed:   ${d.difference >= 0 ? '+' : ''}₹${d.difference.toLocaleString()}`;
      }).join('\n\n');

      const footer = `\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n⚡ PROPOSED ACTION:\nUpdate ${discrepancies.length} team record(s) in Firestore to match approved settlement totals.\n\n❓ Do you approve these changes?`;

      const confirmFix = window.confirm(header + discrepancyDetails + footer);

      if (!confirmFix) {
        alert('❌ Changes cancelled. No updates were made to the database.');
        return;
      }

      // Apply fixes with progress tracking
      let successCount = 0;
      let failCount = 0;

      for (const discrepancy of discrepancies) {
        try {
          const teamRef = doc(db, 'teams', discrepancy.teamId);
          await updateDoc(teamRef, {
            totalMoneySettled: discrepancy.calculatedTotal
          });
          successCount++;
        } catch (error) {
          console.error(`Failed to update ${discrepancy.teamName}:`, error);
          failCount++;
        }
      }

      // Show results
      if (failCount === 0) {
        alert(`✅ SUCCESS!\n\nUpdated ${successCount} team settlement total(s).\n\nAll discrepancies have been resolved.\nDatabase is now in sync with approved settlements.`);
      } else {
        alert(`⚠️ PARTIAL SUCCESS\n\nUpdated: ${successCount} team(s)\nFailed: ${failCount} team(s)\n\nPlease check console for error details and try again.`);
      }
    } catch (error) {
      console.error('Error reconciling settlements:', error);
      alert('❌ ERROR\n\nError reconciling settlements: ' + error.message + '\n\nPlease check console for details.');
    }
  };

  // Expense management
  const submitExpense = async () => {
    try {
      // Validation
      if (!currentUser) {
        alert('User not logged in. Please log in again.');
        return;
      }

      if (currentUser.role !== 'admin' && !currentUser.teamId) {
        alert('Team ID not found. Please log in again.');
        return;
      }

      const amount = parseFloat(expenseForm.amount);
      if (!amount || amount <= 0) {
        alert('Please enter a valid expense amount greater than 0.');
        return;
      }

      if (!expenseForm.description || expenseForm.description.trim() === '') {
        alert('Please enter a description for the expense.');
        return;
      }

      if (!expenseForm.date) {
        alert('Please select a date for the expense.');
        return;
      }

      const expenseData = {
        teamId: currentUser.role === 'admin' ? 'admin' : currentUser.teamId,
        teamName: currentUser.role === 'admin' ? 'Admin' : currentUser.name,
        amount: amount,
        description: expenseForm.description.trim(),
        category: expenseForm.category,
        date: expenseForm.date,
        submittedAt: new Date().toISOString(),
        submittedBy: currentUser.uid
      };

      await addDoc(collection(db, 'expenses'), expenseData);
      
      // If admin, update admin account expenses using transaction
      if (currentUser.role === 'admin') {
        const adminAccountRef = doc(db, 'adminAccount', 'main');
        
        await runTransaction(db, async (transaction) => {
          const adminAccountSnap = await transaction.get(adminAccountRef);
          
          if (adminAccountSnap.exists()) {
            const currentData = adminAccountSnap.data();
            const newTotalExpenses = (currentData.totalExpenses || 0) + parseFloat(expenseForm.amount);
            transaction.update(adminAccountRef, {
              totalExpenses: newTotalExpenses,
              balance: (currentData.totalReceived || 0) - newTotalExpenses
            });
          } else {
            transaction.set(adminAccountRef, {
              totalReceived: 0,
              totalExpenses: parseFloat(expenseForm.amount),
              balance: -parseFloat(expenseForm.amount)
            });
          }
        });
      }
      
      setExpenseForm({
        amount: 0,
        description: '',
        date: new Date().toISOString().split('T')[0],
        category: 'Other'
      });
      setShowModal(false);
      alert('Expense submitted successfully!');
    } catch (error) {
      console.error('Error submitting expense:', error);
      
      // More specific error messages
      let errorMessage = 'Error submitting expense. Please try again.';
      
      if (error.code === 'permission-denied') {
        errorMessage = 'Permission denied. You may not have access to submit expenses.';
      } else if (error.code === 'unavailable') {
        errorMessage = 'Network error. Please check your internet connection and try again.';
      } else if (error.code === 'failed-precondition') {
        errorMessage = 'Database error. Please try again in a moment.';
      } else if (error.message) {
        errorMessage = `Error: ${error.message}`;
      }
      
      alert(errorMessage);
    }
  };

  // Bank submission management (admin only)
  const submitBankSubmission = async () => {
    try {
      // Validation
      if (!currentUser || currentUser.role !== 'admin') {
        alert('Only admin can submit to bank.');
        return;
      }

      const amount = parseFloat(bankSubmissionForm.amount);
      if (!amount || amount <= 0) {
        alert('Please enter a valid amount greater than 0.');
        return;
      }

      if (!bankSubmissionForm.date) {
        alert('Please select a date.');
        return;
      }

      const submissionData = {
        amount: amount,
        date: bankSubmissionForm.date,
        notes: bankSubmissionForm.notes || '',
        submittedAt: new Date().toISOString(),
        submittedBy: currentUser.uid
      };

      await addDoc(collection(db, 'bankSubmissions'), submissionData);
      
      setBankSubmissionForm({
        amount: 0,
        date: new Date().toISOString().split('T')[0],
        notes: ''
      });
      setShowModal(false);
      alert('Bank submission recorded successfully!');
    } catch (error) {
      console.error('Error submitting bank submission:', error);
      
      // More specific error messages
      let errorMessage = 'Error submitting bank submission. Please try again.';
      
      if (error.code === 'permission-denied') {
        errorMessage = 'Permission denied. Only admin can submit to bank.';
      } else if (error.code === 'unavailable') {
        errorMessage = 'Network error. Please check your internet connection and try again.';
      } else if (error.code === 'failed-precondition') {
        errorMessage = 'Database error. Please try again in a moment.';
      } else if (error.message) {
        errorMessage = `Error: ${error.message}`;
      }
      
      alert(errorMessage);
    }
  };

  // Helper functions for expense calculations
  const getTeamExpensesTillSettlement = (teamId, settlementDate) => {
    const teamExpenses = expenses.filter(e => e.teamId === teamId);
    if (!settlementDate) return teamExpenses;
    
    return teamExpenses.filter(e => {
      const expenseDate = new Date(e.date);
      const settlementDateObj = new Date(settlementDate);
      return expenseDate <= settlementDateObj;
    });
  };

  const getTotalTeamExpenses = (teamId) => {
    return expenses
      .filter(e => e.teamId === teamId)
      .reduce((sum, e) => sum + (parseFloat(e.amount) || 0), 0);
  };

  const getAdminExpensesTillBankSubmission = (submissionDate) => {
    const adminExpenses = expenses.filter(e => e.teamId === 'admin');
    if (!submissionDate) return adminExpenses;
    
    return adminExpenses.filter(e => {
      const expenseDate = new Date(e.date);
      const submissionDateObj = new Date(submissionDate);
      return expenseDate <= submissionDateObj;
    });
  };

  const getTotalAdminExpenses = () => {
    return expenses
      .filter(e => e.teamId === 'admin')
      .reduce((sum, e) => sum + (parseFloat(e.amount) || 0), 0);
  };

  // Helper functions for score calculations
  const getMoneySettledTillDate = (teamId, date) => {
    const teamSettlements = moneySettlements.filter(s => 
      s.teamId === teamId && s.status === 'approved'
    );
    
    if (!date) return teamSettlements.reduce((sum, s) => sum + (parseFloat(s.amount) || 0), 0);
    
    // Compare date strings directly (YYYY-MM-DD format allows lexicographic comparison)
    // This avoids timezone issues that occur with Date object comparisons
    return teamSettlements
      .filter(s => {
        // Use the date field (when request was raised) - compare as strings
        return s.date <= date;
      })
      .reduce((sum, s) => sum + (parseFloat(s.amount) || 0), 0);
  };

  const getExpensesTillDate = (teamId, date) => {
    const teamExpenses = expenses.filter(e => e.teamId === teamId);
    
    if (!date) return teamExpenses.reduce((sum, e) => sum + (parseFloat(e.amount) || 0), 0);
    
    const dateObj = new Date(date);
    dateObj.setHours(23, 59, 59, 999); // End of day
    
    return teamExpenses
      .filter(e => {
        const expenseDate = new Date(e.date);
        return expenseDate <= dateObj;
      })
      .reduce((sum, e) => sum + (parseFloat(e.amount) || 0), 0);
  };

  // Generate score sheet
  const generateScoreSheet = async () => {
    if (currentUser.role !== 'admin') {
      alert('You must be an admin to perform this action');
      return;
    }

    if (!scoreGenerationDate) {
      alert('Please select a date for score generation');
      return;
    }

    // Check if date is in the future (using string comparison to avoid timezone issues)
    const todayStr = new Date().toISOString().split('T')[0];
    
    if (scoreGenerationDate > todayStr) {
      alert('Cannot generate scores for future dates');
      return;
    }

    // Check if score sheet already exists for this date
    const dateStr = scoreGenerationDate;
    const existingSheet = scoreSheets.find(sheet => {
      const sheetDate = sheet.generatedDate?.toDate ? sheet.generatedDate.toDate() : new Date(sheet.generatedDate);
      return sheetDate.toISOString().split('T')[0] === dateStr;
    });

    if (existingSheet) {
      alert(`Score sheet already exists for ${dateStr}. Please delete the existing one or select a different date.`);
      return;
    }

    setIsGeneratingScores(true);

    try {
      // Find previous score sheet (most recent one before this date)
      // Use string comparison to avoid timezone issues
      const previousSheet = scoreSheets
        .filter(sheet => {
          const sheetDate = sheet.generatedDate?.toDate ? sheet.generatedDate.toDate() : new Date(sheet.generatedDate);
          const sheetDateStr = sheetDate.toISOString().split('T')[0];
          return sheetDateStr < scoreGenerationDate;
        })
        .sort((a, b) => {
          const dateA = a.generatedDate?.toDate ? a.generatedDate.toDate() : new Date(a.generatedDate);
          const dateB = b.generatedDate?.toDate ? b.generatedDate.toDate() : new Date(b.generatedDate);
          return dateB - dateA;
        })[0];

      const previousDate = previousSheet ? (previousSheet.generatedDate?.toDate ? previousSheet.generatedDate.toDate() : new Date(previousSheet.generatedDate)) : null;

      // Calculate scores for each team
      const teamScores = teams
        .filter(team => team.id !== 'admin') // Exclude admin team
        .map(team => {
          // Get current total money settled
          const moneySettledCurrent = getMoneySettledTillDate(team.id, scoreGenerationDate);

          // Get previous total money settled
          let moneySettledPrevious = 0;
          
          if (previousDate) {
            // Extract YYYY-MM-DD string directly without timezone conversion issues
            const d = previousDate instanceof Date ? previousDate : 
                      (previousDate.toDate ? previousDate.toDate() : new Date(previousDate));
            const year = d.getUTCFullYear();
            const month = String(d.getUTCMonth() + 1).padStart(2, '0');
            const day = String(d.getUTCDate()).padStart(2, '0');
            const prevDateStr = `${year}-${month}-${day}`;
            moneySettledPrevious = getMoneySettledTillDate(team.id, prevDateStr);
          }

          // Calculate score: (money_settled_till_requested_date - money_settled_till_previous_score_date) / 200
          const score = (moneySettledCurrent - moneySettledPrevious) / 200;

          // Calculate aggregate score for this team: (total_money_settled_by_team) / 200
          const aggregateScore = moneySettledCurrent / 200;

          return {
            teamId: team.id,
            teamName: team.name,
            score: Math.round(score * 100) / 100, // Round to 2 decimal places
            aggregateScore: Math.round(aggregateScore * 100) / 100,
            previousScoreSheetDate: previousDate ? Timestamp.fromDate(previousDate) : null
          };
        });

      // Calculate total aggregate score
      const totalAggregateScore = teamScores.reduce((sum, ts) => sum + ts.aggregateScore, 0);

      // Create score sheet document
      // Store generatedDate at UTC midnight to avoid timezone issues
      const scoreSheetData = {
        generatedDate: Timestamp.fromDate(new Date(scoreGenerationDate + 'T00:00:00.000Z')),
        createdAt: Timestamp.now(),
        scores: teamScores,
        totalAggregateScore: Math.round(totalAggregateScore * 100) / 100
      };

      await addDoc(collection(db, 'scoreSheets'), scoreSheetData);

      alert('Score sheet generated successfully!');
      setScoreGenerationDate(new Date().toISOString().split('T')[0]);
    } catch (error) {
      console.error('Error generating score sheet:', error);
      alert('Failed to generate scores. Please try again.');
    } finally {
      setIsGeneratingScores(false);
    }
  };

  // Delete score sheet
  const deleteScoreSheet = async (scoreSheetId) => {
    if (currentUser.role !== 'admin') {
      alert('You must be an admin to perform this action');
      setShowDeleteConfirm(null);
      return;
    }

    try {
      await deleteDoc(doc(db, 'scoreSheets', scoreSheetId));
      setShowDeleteConfirm(null);
      alert('Score sheet deleted successfully!');
    } catch (error) {
      console.error('Error deleting score sheet:', error);
      alert('Failed to delete score sheet. Please try again.');
      setShowDeleteConfirm(null);
    }
  };

  // Edit score sheet (regenerate for the same date)
  const editScoreSheet = async (scoreSheetId) => {
    if (currentUser.role !== 'admin') {
      alert('You must be an admin to perform this action');
      return;
    }

    const scoreSheet = scoreSheets.find(s => s.id === scoreSheetId);
    if (!scoreSheet) {
      alert('Score sheet not found');
      return;
    }

    const sheetDate = scoreSheet.generatedDate?.toDate ? scoreSheet.generatedDate.toDate() : new Date(scoreSheet.generatedDate);
    const dateStr = sheetDate.toISOString().split('T')[0];

    setIsGeneratingScores(true);

    try {
      // Find previous score sheet (most recent one before this date)
      const currentSheetDate = sheetDate;
      const previousSheet = scoreSheets
        .filter(sheet => {
          if (sheet.id === scoreSheetId) return false; // Exclude current sheet
          const prevSheetDate = sheet.generatedDate?.toDate ? sheet.generatedDate.toDate() : new Date(sheet.generatedDate);
          return prevSheetDate < currentSheetDate;
        })
        .sort((a, b) => {
          const dateA = a.generatedDate?.toDate ? a.generatedDate.toDate() : new Date(a.generatedDate);
          const dateB = b.generatedDate?.toDate ? b.generatedDate.toDate() : new Date(b.generatedDate);
          return dateB - dateA;
        })[0];

      const previousDate = previousSheet ? (previousSheet.generatedDate?.toDate ? previousSheet.generatedDate.toDate() : new Date(previousSheet.generatedDate)) : null;

      // Calculate scores for each team
      const teamScores = teams
        .filter(team => team.id !== 'admin')
        .map(team => {
          // Get current total money settled
          const moneySettledCurrent = getMoneySettledTillDate(team.id, dateStr);

          // Get previous total money settled
          let moneySettledPrevious = 0;
          
          if (previousDate) {
            // Extract YYYY-MM-DD string directly without timezone conversion issues
            const d = previousDate instanceof Date ? previousDate : 
                      (previousDate.toDate ? previousDate.toDate() : new Date(previousDate));
            const year = d.getUTCFullYear();
            const month = String(d.getUTCMonth() + 1).padStart(2, '0');
            const day = String(d.getUTCDate()).padStart(2, '0');
            const prevDateStr = `${year}-${month}-${day}`;
            moneySettledPrevious = getMoneySettledTillDate(team.id, prevDateStr);
          }

          // Calculate score: (money_settled_till_requested_date - money_settled_till_previous_score_date) / 200
          const score = (moneySettledCurrent - moneySettledPrevious) / 200;

          // Calculate aggregate score for this team: (total_money_settled_by_team) / 200
          const aggregateScore = moneySettledCurrent / 200;

          return {
            teamId: team.id,
            teamName: team.name,
            score: Math.round(score * 100) / 100,
            aggregateScore: Math.round(aggregateScore * 100) / 100,
            previousScoreSheetDate: previousDate ? Timestamp.fromDate(previousDate) : null
          };
        });

      const totalAggregateScore = teamScores.reduce((sum, ts) => sum + ts.aggregateScore, 0);

      // Update score sheet document
      const scoreSheetRef = doc(db, 'scoreSheets', scoreSheetId);
      await updateDoc(scoreSheetRef, {
        scores: teamScores,
        totalAggregateScore: Math.round(totalAggregateScore * 100) / 100,
        updatedAt: Timestamp.now()
      });

      alert('Score sheet updated successfully!');
    } catch (error) {
      console.error('Error updating score sheet:', error);
      alert('Failed to update score sheet. Please try again.');
    } finally {
      setIsGeneratingScores(false);
    }
  };

  // Toggle score sheet expansion
  const toggleScoreSheet = (scoreSheetId) => {
    const newExpanded = new Set(expandedScoreSheets);
    if (newExpanded.has(scoreSheetId)) {
      newExpanded.delete(scoreSheetId);
    } else {
      newExpanded.add(scoreSheetId);
    }
    setExpandedScoreSheets(newExpanded);
  };
  // Reset forms
  const resetSchoolForm = () => {
    setSchoolForm({
      areaName: '', schoolName: '', activity: 'To Be Visited',
      teluguSetsDistributed: 0, englishSetsDistributed: 0,
      teluguSetsTakenBack: 0, englishSetsTakenBack: 0,
      teluguSetsIssued: 0, englishSetsIssued: 0,
      freeSetsGiven: 0,
      moneyCollected: 0, perSetPrice: 200, 
      contact_person_1_name: '', contact_person_1_phone: '',
      contact_person_2_name: '', contact_person_2_phone: '',
      contact_person_3_name: '', contact_person_3_phone: '',
      email: '', notes: '', date: new Date().toISOString().split('T')[0],
      payments: [], updates: []
    });
    // Reset incremental update state
    setIncrementalUpdate({
      teluguSetsDistributed: 0,
      englishSetsDistributed: 0,
      teluguSetsTakenBack: 0,
      englishSetsTakenBack: 0,
      teluguSetsIssued: 0,
      englishSetsIssued: 0,
      freeSetsGiven: 0,
      moneyCollected: 0,
      date: new Date().toISOString().split('T')[0]
    });
  };

  // Function to add incremental update
  const addIncrementalUpdate = (field, value) => {
    const update = {
      field,
      value: parseFloat(value) || 0,
      date: incrementalUpdate.date,
      timestamp: new Date().toISOString()
    };
    
    // Add to updates array
    const updatedSchoolForm = {
      ...schoolForm,
      updates: [...(schoolForm.updates || []), update]
    };
    
    // Update the main field with new total
    const newValue = (schoolForm[field] || 0) + update.value;
    updatedSchoolForm[field] = newValue;
    
    setSchoolForm(updatedSchoolForm);
    
    // Reset the incremental input field
    setIncrementalUpdate({
      ...incrementalUpdate,
      [field]: 0
    });
    
    alert(`Added ${update.value} to ${field}. New total: ${newValue}`);
  };

  // Add multiple incremental fields as a single update batch
  const addAllIncrementalUpdates = () => {
    const fields = ['moneyCollected', 'teluguSetsDistributed', 'englishSetsDistributed',
                    'teluguSetsIssued', 'englishSetsIssued',
                    'teluguSetsTakenBack', 'englishSetsTakenBack', 'freeSetsGiven'];

    const values = {};
    fields.forEach(f => {
      const v = Number(incrementalUpdate[f]) || 0;
      if (v > 0) values[f] = v;
    });

    if (Object.keys(values).length === 0) {
      alert('No updates to add');
      return;
    }

    const update = {
      ...values,
      date: incrementalUpdate.date,
      timestamp: new Date().toISOString()
    };

    // Add to updates array as a single batch object
    const updatedSchoolForm = {
      ...schoolForm,
      updates: [...(schoolForm.updates || []), update]
    };

    // Update main school totals for each provided field
    Object.keys(values).forEach(k => {
      updatedSchoolForm[k] = (Number(schoolForm[k]) || 0) + values[k];
    });

    setSchoolForm(updatedSchoolForm);

    // Reset incremental inputs
    setIncrementalUpdate({
      ...incrementalUpdate,
      moneyCollected: 0,
      teluguSetsDistributed: 0,
      englishSetsDistributed: 0,
      teluguSetsIssued: 0,
      englishSetsIssued: 0,
      teluguSetsTakenBack: 0,
      englishSetsTakenBack: 0,
      freeSetsGiven: 0
    });

    alert('Updates added');
  };

  const resetTeamForm = () => {
    setTeamForm({ 
      name: '', username: '', password: '', contact: '',
      inventory: { gitaTelugu: 0, gitaEnglish: 0, bookletTelugu: 0, bookletEnglish: 0, calendar: 0, chikki: 0 }
    });
  };

  const resetRequirementForm = () => {
    setRequirementForm({ 
      gitaTelugu: 0, gitaEnglish: 0, bookletTelugu: 0, bookletEnglish: 0, calendar: 0, chikki: 0, reason: '' 
    });
  };

  const resetSettlementForm = () => {
    setSettlementForm({ amount: 0, paymentMethod: 'Cash', date: new Date().toISOString().split('T')[0], notes: '', teamId: '' });
  };

  // Calculations
  const getTeamStats = (teamId) => {
    const team = teams.find(t => t.id === teamId);
    const teamSchools = schools.filter(s => s.teamId === teamId);
    const totalCollected = teamSchools.reduce((sum, s) => sum + parseFloat(s.moneyCollected || 0), 0);
    const totalSettled = teamSchools.filter(s => s.moneySettled).reduce((sum, s) => sum + parseFloat(s.moneyCollected || 0), 0);
    const totalMoneySettled = parseInt(team?.totalMoneySettled || 0);
    const totalTeluguDistributed = teamSchools.reduce((sum, s) => sum + parseInt(s.teluguSetsDistributed || 0), 0);
    const totalEnglishDistributed = teamSchools.reduce((sum, s) => sum + parseInt(s.englishSetsDistributed || 0), 0);
    const totalDistributed = totalTeluguDistributed + totalEnglishDistributed;
    const totalFree = teamSchools.reduce((sum, s) => sum + parseInt(s.freeSetsGiven || 0), 0);
    const totalTeluguTakenBack = teamSchools.reduce((sum, s) => 
                            sum + parseInt(s.teluguSetsTakenBack || 0), 0);
    const totalEnglishTakenBack = teamSchools.reduce((sum, s) => 
                            sum + parseInt(s.englishSetsTakenBack || 0), 0);
    const totalOnHold = teamSchools.reduce((sum, s) => 
                            sum + parseInt(s.teluguSetsOnHold || 0) + parseInt(s.englishSetsOnHold || 0), 0);
    
    // Calculate Sets Remaining in Schools
    const totalTeluguRemaining = teamSchools.reduce((sum, s) => {
      const teluguIssued = parseInt(s.teluguSetsIssued || 0);
      const teluguDistributed = parseInt(s.teluguSetsDistributed || 0);
      const teluguTakenBack = parseInt(s.teluguSetsTakenBack || 0);
      return sum + Math.max(0, teluguIssued - teluguDistributed - teluguTakenBack);
    }, 0);
    
    const totalEnglishRemaining = teamSchools.reduce((sum, s) => {
      const englishIssued = parseInt(s.englishSetsIssued || 0);
      const englishDistributed = parseInt(s.englishSetsDistributed || 0);
      const englishTakenBack = parseInt(s.englishSetsTakenBack || 0);
      return sum + Math.max(0, englishIssued - englishDistributed - englishTakenBack);
    }, 0);
    
    const totalSetsRemaining = totalTeluguRemaining + totalEnglishRemaining;
    
    // Calculate Money Yet to be Collected
    const moneyYetToBeCollected = teamSchools.reduce((sum, s) => {
      const teluguIssued = parseInt(s.teluguSetsIssued || 0);
      const englishIssued = parseInt(s.englishSetsIssued || 0);
      const teluguDistributed = parseInt(s.teluguSetsDistributed || 0);
      const englishDistributed = parseInt(s.englishSetsDistributed || 0);
      const teluguTakenBack = parseInt(s.teluguSetsTakenBack || 0);
      const englishTakenBack = parseInt(s.englishSetsTakenBack || 0);
      const perSetPrice = parseFloat(s.perSetPrice || 200); // Default to 200 if not set
      
      const setsRemaining = Math.max(0, (teluguIssued + englishIssued) - (teluguDistributed + englishDistributed) - (teluguTakenBack + englishTakenBack));
      return sum + (perSetPrice * setsRemaining);
    }, 0);
    
    return {
      totalSchools: teamSchools.length,
      totalCollected,
      totalSettled,
      totalMoneySettled,
      totalDistributed,
      totalTeluguTakenBack,
      totalEnglishTakenBack,
      totalOnHold,
      totalTeluguDistributed,
      totalEnglishDistributed,
      totalFree,
      areas: [...new Set(teamSchools.map(s => s.areaName))].length,
      totalTeluguRemaining,
      totalEnglishRemaining,
      totalSetsRemaining,
      moneyYetToBeCollected
    };
  };

  // Filtering
  const getFilteredSchools = () => {
    let filtered = schools;
    
    if (currentUser?.role === 'team') {
      filtered = filtered.filter(s => s.teamId === currentUser.teamId);
    } else if (selectedTeam) {
      filtered = filtered.filter(s => s.teamId === selectedTeam);
    }
    
    if (searchTerm) {
      filtered = filtered.filter(s => 
        s.schoolName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.areaName.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    if (dateFilter.start) {
      filtered = filtered.filter(s => s.date >= dateFilter.start);
    }
    if (dateFilter.end) {
      filtered = filtered.filter(s => s.date <= dateFilter.end);
    }
    
    // Filter by activity tab (if not "All Schools")
    if (selectedActivityTab !== 'All Schools') {
      filtered = filtered.filter(s => {
        const schoolActivity = getSchoolActivity(s);
        return schoolActivity === selectedActivityTab;
      });
    }
    
    // Sort by last updated timestamp (newest first)
    filtered.sort((a, b) => {
      const getTimestamp = (school) => {
        // Try different possible timestamp field names
        const timestamp = school.lastUpdated || school.updatedAt || school.last_updated || school.updated_at || school.createdAt || school.created_at;
        if (!timestamp) return 0;
        
        // Handle Firestore Timestamp objects
        if (timestamp && typeof timestamp.toDate === 'function') {
          return timestamp.toDate().getTime();
        }
        
        // Handle ISO string or number
        if (typeof timestamp === 'string') {
          return new Date(timestamp).getTime();
        }
        
        if (typeof timestamp === 'number') {
          return timestamp;
        }
        
        return 0;
      };
      
      const timeA = getTimestamp(a);
      const timeB = getTimestamp(b);
      return timeB - timeA; // Newest first
    });
    
    return filtered;
  };

  // Get count of schools by activity
  const getActivityCount = (activity) => {
    let filtered = schools;
    
    if (currentUser?.role === 'team') {
      filtered = filtered.filter(s => s.teamId === currentUser.teamId);
    } else if (selectedTeam) {
      filtered = filtered.filter(s => s.teamId === selectedTeam);
    }
    
    if (activity === 'All Schools') {
      return filtered.length;
    }
    
    return filtered.filter(s => getSchoolActivity(s) === activity).length;
  };

  const sanitizeFilename = (name = 'export') => {
    return name
      .toString()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '') || 'export';
  };

  const exportTableToCSV = (tableId, filenamePrefix = 'export') => {
    const table = document.getElementById(tableId);
    if (!table) {
      console.warn(`Table with id "${tableId}" not found`);
      return;
    }

    const rows = Array.from(table.querySelectorAll('tr')).map((row) =>
      Array.from(row.querySelectorAll('th, td'))
        .map((cell) => {
          const text = cell.innerText.replace(/\s*\n\s*/g, ' ').trim();
          return `"${text.replace(/"/g, '""')}"`;
        })
        .join(',')
    );

    if (rows.length === 0) {
      console.warn(`Table with id "${tableId}" has no rows to export`);
      return;
    }

    const csv = rows.join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${sanitizeFilename(filenamePrefix)}_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  // Login Screen
  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-orange-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl p-8 w-full max-w-md">
          <div className="text-center mb-8">
            <BookOpen className="w-16 h-16 text-orange-600 mx-auto mb-4" />
            <h1 className="text-3xl font-bold text-gray-800">VEC Portal</h1>
            <p className="text-gray-600">Gita Marathon</p>
          </div>
          
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Username</label>
              <input
                type="text"
                value={loginForm.username}
                onChange={(e) => setLoginForm({...loginForm, username: e.target.value})}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                placeholder="Enter username"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
              <input
                type="password"
                value={loginForm.password}
                onChange={(e) => setLoginForm({...loginForm, password: e.target.value})}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                placeholder="Enter password"
              />
            </div>
            
            <button
              type="submit" // Change to submit
              onClick={handleLogin} // Simplified - remove the wrapper
              className="w-full bg-orange-600 text-white py-2 rounded-lg hover:bg-orange-700 transition-colors font-medium"
              >
              Login
            </button>
          </form>
          
        
        </div>
      </div>
    );
  }

  // Main Dashboard
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-orange-600 text-white shadow-lg">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <BookOpen className="w-8 h-8" />
              <div>
                <h1 className="text-2xl font-bold">VEC Portal</h1>
                <p className="text-orange-100 text-sm">
                  {currentUser.role === 'admin' ? 'Admin Dashboard' : currentUser.name}
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              {currentUser.role === 'admin' && notifications.length > 0 && (
                <div className="relative">
                  <Bell className="w-6 h-6 cursor-pointer" onClick={() => setActiveView('notifications')} />
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {notifications.length}
                  </span>
                </div>
              )}
              <button
                onClick={handleLogout}
                className="flex items-center space-x-2 bg-orange-700 px-4 py-2 rounded-lg hover:bg-orange-800 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="bg-white shadow-md">
        <div className="container mx-auto px-4">
          <div className="-mx-4 overflow-x-auto">
            <div className="inline-flex min-w-max space-x-1 px-4 whitespace-nowrap">
            <button
              onClick={() => setActiveView('dashboard')}
              className={`px-6 py-3 font-medium ${activeView === 'dashboard' ? 'text-orange-600 border-b-2 border-orange-600' : 'text-gray-600 hover:text-orange-600'}`}
            >
              Dashboard
            </button>
            <button
              onClick={() => setActiveView('schools')}
              className={`px-6 py-3 font-medium ${activeView === 'schools' ? 'text-orange-600 border-b-2 border-orange-600' : 'text-gray-600 hover:text-orange-600'}`}
            >
              Schools
            </button>
            <button
              onClick={() => setActiveView('schoolUpdates')}
              className={`px-6 py-3 font-medium ${activeView === 'schoolUpdates' ? 'text-orange-600 border-b-2 border-orange-600' : 'text-gray-600 hover:text-orange-600'}`}
            >
              School Updates
            </button>
            {currentUser.role === 'admin' && (
              <>
                <button
                  onClick={() => setActiveView('inventory')}
                  className={`px-6 py-3 font-medium ${activeView === 'inventory' ? 'text-orange-600 border-b-2 border-orange-600' : 'text-gray-600 hover:text-orange-600'}`}
                >
                  Inventory
                </button>
                <button
                  onClick={() => setActiveView('requirements')}
                  className={`px-6 py-3 font-medium ${activeView === 'requirements' ? 'text-orange-600 border-b-2 border-orange-600' : 'text-gray-600 hover:text-orange-600'}`}
                >
                  Requirements
                </button>
                <button
                  onClick={() => setActiveView('settlements')}
                  className={`px-6 py-3 font-medium ${activeView === 'settlements' ? 'text-orange-600 border-b-2 border-orange-600' : 'text-gray-600 hover:text-orange-600'}`}
                >
                  Money Settlements
                </button>
                <button
                  onClick={() => setActiveView('expenses')}
                  className={`px-6 py-3 font-medium ${activeView === 'expenses' ? 'text-orange-600 border-b-2 border-orange-600' : 'text-gray-600 hover:text-orange-600'}`}
                >
                  Expenses
                </button>
                <button
                  onClick={() => setActiveView('scores')}
                  className={`px-6 py-3 font-medium ${activeView === 'scores' ? 'text-orange-600 border-b-2 border-orange-600' : 'text-gray-600 hover:text-orange-600'}`}
                >
                  Scores
                </button>
                <button
                  onClick={() => setActiveView('masterInventory')}
                  className={`px-6 py-3 font-medium ${activeView === 'masterInventory' ? 'text-orange-600 border-b-2 border-orange-600' : 'text-gray-600 hover:text-orange-600'}`}
                >
                  Master Inventory
                </button>
              </>
            )}
            {currentUser.role === 'team' && (
              <>
                <button
                  onClick={() => setActiveView('inventory')}
                  className={`px-6 py-3 font-medium ${activeView === 'inventory' ? 'text-orange-600 border-b-2 border-orange-600' : 'text-gray-600 hover:text-orange-600'}`}
                >
                  Inventory
                </button>
                <button
                  onClick={() => setActiveView('settlements')}
                  className={`px-6 py-3 font-medium ${activeView === 'settlements' ? 'text-orange-600 border-b-2 border-orange-600' : 'text-gray-600 hover:text-orange-600'}`}
                >
                  Money Settlement
                </button>
                <button
                  onClick={() => setActiveView('expenses')}
                  className={`px-6 py-3 font-medium ${activeView === 'expenses' ? 'text-orange-600 border-b-2 border-orange-600' : 'text-gray-600 hover:text-orange-600'}`}
                >
                  Expenses
                </button>
                <button
                  onClick={() => setActiveView('scores')}
                  className={`px-6 py-3 font-medium ${activeView === 'scores' ? 'text-orange-600 border-b-2 border-orange-600' : 'text-gray-600 hover:text-orange-600'}`}
                >
                  Scores
                </button>
              </>
            )}
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Dashboard View */}
        {activeView === 'dashboard' && (
          <div className="space-y-6">
            {/* Quick Actions */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Quick Actions</h3>
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() => {
                    setModalType('school');
                    setEditingItem(null);
                    resetSchoolForm();
                    setShowModal(true);
                  }}
                  className="flex items-center space-x-2 bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add School</span>
                </button>
                
                {currentUser.role === 'admin' && (
                  <button
                    onClick={() => {
                      setModalType('team');
                      setEditingItem(null);
                      resetTeamForm();
                      setShowModal(true);
                    }}
                    className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add Team</span>
                  </button>
                )}
                
                {currentUser.role === 'team' && (
                  <button
                    onClick={() => {
                      setModalType('requirement');
                      resetRequirementForm();
                      setShowModal(true);
                    }}
                    className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <Package className="w-4 h-4" />
                    <span>Raise Requirement</span>
                  </button>
                )}
                
              </div>
            </div>

            {/* Team Selector for Admin */}
            {currentUser.role === 'admin' && (
              <div className="bg-white rounded-lg shadow-md p-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Select Team</label>
                <select
                  value={selectedTeam || ''}
                  onChange={(e) => setSelectedTeam(e.target.value || null)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                >
                  <option value="">All Teams</option>
                  {teams.map(team => (
                    <option key={team.id} value={team.id}>{team.name}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {(currentUser.role === 'admin' ? (selectedTeam ? [teams.find(t => t.id === selectedTeam)] : teams) : [teams.find(t => t.id === currentUser.teamId)]).filter(Boolean).map(team => {
                const stats = getTeamStats(team.id);
                return (
                  <div key={team.id} className="bg-white rounded-lg shadow-md p-6">
                    <h3 className="text-lg font-semibold text-gray-800 mb-2">{team.name}</h3>
                    {currentUser.role === 'admin' && team.username && (
                      <>
                        <p className="text-sm text-gray-500 mb-1">Username: <span className="font-medium text-gray-700">{team.username}</span></p>
                        {team.contact && (
                          <p className="text-sm text-gray-500 mb-4">Phone: <span className="font-medium text-gray-700">{team.contact}</span></p>
                        )}
                      </>
                    )}
                    
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Areas Covered</span>
                        <span className="font-semibold text-gray-800">{stats.areas}</span>
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Schools</span>
                        <span className="font-semibold text-gray-800">{stats.totalSchools}</span>
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Sets Distributed</span>
                        <div className="text-right">
                          <div className="font-semibold text-green-600">{stats.totalDistributed} Total</div>
                          <div className="text-xs text-gray-600">
                            Telugu: {stats.totalTeluguDistributed} | English: {stats.totalEnglishDistributed}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Free Sets</span>
                        <span className="font-semibold text-blue-600">{stats.totalFree}</span>
                      </div>
                      
                     
                      
                      <div className="border-t pt-3">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-sm text-gray-600">Total Collected</span>
                          <span className="font-semibold text-green-700">₹{stats.totalCollected.toLocaleString()}</span>
                        </div>
                        
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">Total Money Settled</span>
                          <span className="font-semibold text-green-700">₹{stats.totalMoneySettled.toLocaleString()}</span>
                        </div>
                        
                        {/* Settlement Calculation */}
                        
                      </div>
                      
                      <div className="border-t pt-3 mt-3">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-sm text-gray-600">Sets Remaining in Schools</span>
                          <div className="text-right">
                            <div className="font-semibold text-orange-600">{stats.totalSetsRemaining} Total</div>
                            <div className="text-xs text-gray-600">
                              Telugu: {stats.totalTeluguRemaining} | English: {stats.totalEnglishRemaining}
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="border-t pt-3 mt-3">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">Money Yet to be Collected</span>
                          <span className="font-semibold text-red-700">₹{Math.round(stats.moneyYetToBeCollected).toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Schools View */}
        {activeView === 'schools' && (
          <div className="space-y-6">
            {/* Filters */}
            <div className="bg-white rounded-lg shadow-md p-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
                  <div className="relative">
                    <Search className="w-5 h-5 absolute left-3 top-2.5 text-gray-400" />
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Search schools or areas..."
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
                  <input
                    type="date"
                    value={dateFilter.start}
                    onChange={(e) => setDateFilter({...dateFilter, start: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">End Date</label>
                  <input
                    type="date"
                    value={dateFilter.end}
                    onChange={(e) => setDateFilter({...dateFilter, end: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                  />
                </div>
              </div>
              
              {(searchTerm || dateFilter.start || dateFilter.end) && (
                <button
                  onClick={() => {
                    setSearchTerm('');
                    setDateFilter({ start: '', end: '' });
                  }}
                  className="mt-4 flex items-center space-x-2 text-orange-600 hover:text-orange-700"
                >
                  <X className="w-4 h-4" />
                  <span>Clear Filters</span>
                </button>
              )}
            </div>

            {/* Activity Tabs */}
            <div className="bg-white rounded-lg shadow-md overflow-hidden mb-4">
              <div className="border-b border-gray-200">
                <nav className="flex flex-wrap -mb-px overflow-x-auto" aria-label="Activity tabs">
                  {['To Be Visited', 'Visited', 'Announcement Pending', 'Announced', 'To Close', 'Settlement Closed', 'Declined', 'All Schools'].map((activity) => {
                    // Map activity value to display name
                    const displayName = activity === 'Announced' ? 'Announced/Books to be given' : activity;
                    return (
                      <button
                        key={activity}
                        onClick={() => setSelectedActivityTab(activity)}
                        className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                          selectedActivityTab === activity
                            ? 'border-orange-600 text-orange-600'
                            : 'border-transparent text-gray-600 hover:text-orange-600 hover:border-gray-300'
                        }`}
                      >
                        {displayName}
                        <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${
                          selectedActivityTab === activity
                            ? 'bg-orange-100 text-orange-700'
                            : 'bg-gray-100 text-gray-700'
                        }`}>
                          {getActivityCount(activity)}
                        </span>
                      </button>
                    );
                  })}
                </nav>
              </div>
            </div>

            {/* Schools Table */}
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 border-b bg-gray-50">
                <div>
                  <h3 className="text-lg font-semibold text-gray-800">Schools</h3>
                  <p className="text-sm text-gray-500">Filtered list of all schools</p>
                </div>
                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => {
                      setModalType('school');
                      setEditingItem(null);
                      setSchoolForm({
                        areaName: '',
                        schoolName: '',
                        date: new Date().toISOString().split('T')[0],
                        activity: 'To Be Visited',
                        teluguSetsDistributed: 0,
                        englishSetsDistributed: 0,
                        moneyCollected: 0,
                        teluguSetsTakenBack: 0,
                        englishSetsTakenBack: 0,
                        teluguSetsIssued: 0,
                        englishSetsIssued: 0,
                        freeSetsGiven: 0,
                        pamphlets: 0,
                        perSetPrice: perSetPrice,
                        contact_person_1_name: '',
                        contact_person_1_phone: '',
                        contact_person_2_name: '',
                        contact_person_2_phone: '',
                        contact_person_3_name: '',
                        contact_person_3_phone: '',
                        email: '',
                        notes: ''
                      });
                      setShowModal(true);
                    }}
                    className="flex items-center space-x-2 bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add School</span>
                  </button>
                  <button
                    onClick={() => exportTableToCSV('schools-table', 'schools')}
                    className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
                  >
                    <Download className="w-4 h-4" />
                    <span>Export CSV</span>
                  </button>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table id="schools-table" className="w-full min-w-[700px]">
                  <thead className="bg-gray-50 border-b border-black">
                    <tr>
                      {currentUser.role === 'admin' && <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 border-r border-black">Team</th>}
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 border-r border-black">Area</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 border-r border-black">School</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 border-r border-black">Activity</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 border-r border-black">Principal Details</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 border-r border-black">Coordinator Details</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 border-r border-black">Announcement Date</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 border-r border-black">Comments</th>
                      <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700 border-r border-black">Telugu Sets Distr.</th>
                      <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700 border-r border-black">English Sets Distr.</th>
                      <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700 border-r border-black">Telugu Sets Issued</th>
                      <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700 border-r border-black">English Sets Issued</th>
                      <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700 border-r border-black">Telugu Sets Taken Back</th>
                      <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700 border-r border-black">English Sets Taken Back</th>
                      <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700 border-r border-black">Money</th>
                      <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700 border-r border-black">Difference</th>
                      <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-black">
                    {getFilteredSchools().map(school => (
                      <tr key={school.id} className="hover:bg-gray-50">
                        {currentUser.role === 'admin' && (
                          <td className="px-4 py-3 text-sm text-gray-900 border-r border-black">
                            {teams.find(t => t.id === school.teamId)?.name}
                          </td>
                        )}
                        <td 
                          className="px-4 py-3 text-sm text-gray-900 border-r border-black cursor-pointer hover:bg-blue-50 transition-colors relative group"
                          onClick={() => startInlineEdit(school.id, 'areaName', school.areaName)}
                        >
                          {editingCell?.schoolId === school.id && editingCell?.field === 'areaName' ? (
                            <div className="flex items-center gap-1">
                              <input
                                type="text"
                                value={editingCellValue}
                                onChange={(e) => setEditingCellValue(e.target.value)}
                                onKeyDown={handleInlineEditKeyPress}
                                onBlur={saveInlineEdit}
                                autoFocus
                                className="flex-1 px-2 py-1 border-2 border-blue-500 rounded focus:outline-none"
                                onClick={(e) => e.stopPropagation()}
                              />
                              <button onClick={saveInlineEdit} className="p-1 text-green-600 hover:bg-green-100 rounded" title="Save">
                                <Check className="w-3 h-3" />
                              </button>
                              <button onClick={cancelInlineEdit} className="p-1 text-red-600 hover:bg-red-100 rounded" title="Cancel">
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                          ) : (
                            <>
                              {school.areaName}
                              <span className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-50">
                                <Edit2 className="w-3 h-3 text-blue-600" />
                              </span>
                            </>
                          )}
                        </td>
                        <td 
                          className="px-4 py-3 text-sm text-gray-900 border-r border-black cursor-pointer hover:bg-blue-50 transition-colors relative group"
                          onClick={() => startInlineEdit(school.id, 'schoolName', school.schoolName)}
                        >
                          {editingCell?.schoolId === school.id && editingCell?.field === 'schoolName' ? (
                            <div className="flex items-center gap-1">
                              <input
                                type="text"
                                value={editingCellValue}
                                onChange={(e) => setEditingCellValue(e.target.value)}
                                onKeyDown={handleInlineEditKeyPress}
                                onBlur={saveInlineEdit}
                                autoFocus
                                className="flex-1 px-2 py-1 border-2 border-blue-500 rounded focus:outline-none"
                                onClick={(e) => e.stopPropagation()}
                              />
                              <button onClick={saveInlineEdit} className="p-1 text-green-600 hover:bg-green-100 rounded" title="Save">
                                <Check className="w-3 h-3" />
                              </button>
                              <button onClick={cancelInlineEdit} className="p-1 text-red-600 hover:bg-red-100 rounded" title="Cancel">
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                          ) : (
                            <>
                              {school.schoolName}
                              <span className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-50">
                                <Edit2 className="w-3 h-3 text-blue-600" />
                              </span>
                            </>
                          )}
                        </td>
                        <td className="px-4 py-3 border-r border-black">
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            (() => {
                              const activity = getSchoolActivity(school);
                              if (activity === 'Announced' || activity === 'Settlement Closed') return 'bg-green-100 text-green-700';
                              if (activity === 'Declined') return 'bg-red-100 text-red-700';
                              if (activity === 'To Close' || activity === 'Announcement Pending') return 'bg-yellow-100 text-yellow-700';
                              if (activity === 'Visited') return 'bg-blue-100 text-blue-700';
                              return 'bg-gray-100 text-gray-700';
                            })()
                          }`}>
                            {getSchoolActivity(school)}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-700 border-r border-black">
                          {school.contact_person_1_name || school.contactPerson ? (
                            <div>
                              <div className="font-medium">{school.contact_person_1_name || school.contactPerson}</div>
                              <div className="text-xs text-gray-500">{school.contact_person_1_phone || school.contactNumber || ''}</div>
                            </div>
                          ) : '-'}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-700 border-r border-black">
                          {school.contact_person_2_name ? (
                            <div>
                              <div className="font-medium">{school.contact_person_2_name}</div>
                              <div className="text-xs text-gray-500">{school.contact_person_2_phone || ''}</div>
                            </div>
                          ) : '-'}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600 border-r border-black">{school.date}</td>
                        <td className="px-4 py-3 text-sm text-gray-700 border-r border-black">
                          {school.notes?.trim() ? school.notes : '-'}
                        </td>
                        <td 
                          className="px-4 py-3 text-sm text-right text-gray-900 border-r border-black cursor-pointer hover:bg-blue-50 transition-colors relative group"
                          onClick={() => startInlineEdit(school.id, 'teluguSetsDistributed', school.teluguSetsDistributed || 0)}
                        >
                          {editingCell?.schoolId === school.id && editingCell?.field === 'teluguSetsDistributed' ? (
                            <div className="flex items-center justify-end gap-1">
                              <input
                                type="number"
                                value={editingCellValue}
                                onChange={(e) => setEditingCellValue(e.target.value)}
                                onKeyDown={handleInlineEditKeyPress}
                                onBlur={saveInlineEdit}
                                autoFocus
                                className="w-20 px-2 py-1 border-2 border-blue-500 rounded focus:outline-none text-right"
                                onClick={(e) => e.stopPropagation()}
                              />
                              <button onClick={saveInlineEdit} className="p-1 text-green-600 hover:bg-green-100 rounded">
                                <Check className="w-3 h-3" />
                              </button>
                              <button onClick={cancelInlineEdit} className="p-1 text-red-600 hover:bg-red-100 rounded">
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                          ) : (
                            <>
                              {school.teluguSetsDistributed || 0}
                              <span className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-50">
                                <Edit2 className="w-3 h-3 text-blue-600" />
                              </span>
                            </>
                          )}
                        </td>
                        <td 
                          className="px-4 py-3 text-sm text-right text-gray-900 border-r border-black cursor-pointer hover:bg-blue-50 transition-colors relative group"
                          onClick={() => startInlineEdit(school.id, 'englishSetsDistributed', school.englishSetsDistributed || 0)}
                        >
                          {editingCell?.schoolId === school.id && editingCell?.field === 'englishSetsDistributed' ? (
                            <div className="flex items-center justify-end gap-1">
                              <input
                                type="number"
                                value={editingCellValue}
                                onChange={(e) => setEditingCellValue(e.target.value)}
                                onKeyDown={handleInlineEditKeyPress}
                                onBlur={saveInlineEdit}
                                autoFocus
                                className="w-20 px-2 py-1 border-2 border-blue-500 rounded focus:outline-none text-right"
                                onClick={(e) => e.stopPropagation()}
                              />
                              <button onClick={saveInlineEdit} className="p-1 text-green-600 hover:bg-green-100 rounded">
                                <Check className="w-3 h-3" />
                              </button>
                              <button onClick={cancelInlineEdit} className="p-1 text-red-600 hover:bg-red-100 rounded">
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                          ) : (
                            <>
                              {school.englishSetsDistributed || 0}
                              <span className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-50">
                                <Edit2 className="w-3 h-3 text-blue-600" />
                              </span>
                            </>
                          )}
                        </td>
                        <td 
                          className="px-4 py-3 text-sm text-right text-gray-900 border-r border-black cursor-pointer hover:bg-blue-50 transition-colors relative group"
                          onClick={() => startInlineEdit(school.id, 'teluguSetsIssued', school.teluguSetsIssued || 0)}
                        >
                          {editingCell?.schoolId === school.id && editingCell?.field === 'teluguSetsIssued' ? (
                            <div className="flex items-center justify-end gap-1">
                              <input
                                type="number"
                                value={editingCellValue}
                                onChange={(e) => setEditingCellValue(e.target.value)}
                                onKeyDown={handleInlineEditKeyPress}
                                onBlur={saveInlineEdit}
                                autoFocus
                                className="w-20 px-2 py-1 border-2 border-blue-500 rounded focus:outline-none text-right"
                                onClick={(e) => e.stopPropagation()}
                              />
                              <button onClick={saveInlineEdit} className="p-1 text-green-600 hover:bg-green-100 rounded">
                                <Check className="w-3 h-3" />
                              </button>
                              <button onClick={cancelInlineEdit} className="p-1 text-red-600 hover:bg-red-100 rounded">
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                          ) : (
                            <>
                              {school.teluguSetsIssued || 0}
                              <span className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-50">
                                <Edit2 className="w-3 h-3 text-blue-600" />
                              </span>
                            </>
                          )}
                        </td>
                        <td 
                          className="px-4 py-3 text-sm text-right text-gray-900 border-r border-black cursor-pointer hover:bg-blue-50 transition-colors relative group"
                          onClick={() => startInlineEdit(school.id, 'englishSetsIssued', school.englishSetsIssued || 0)}
                        >
                          {editingCell?.schoolId === school.id && editingCell?.field === 'englishSetsIssued' ? (
                            <div className="flex items-center justify-end gap-1">
                              <input
                                type="number"
                                value={editingCellValue}
                                onChange={(e) => setEditingCellValue(e.target.value)}
                                onKeyDown={handleInlineEditKeyPress}
                                onBlur={saveInlineEdit}
                                autoFocus
                                className="w-20 px-2 py-1 border-2 border-blue-500 rounded focus:outline-none text-right"
                                onClick={(e) => e.stopPropagation()}
                              />
                              <button onClick={saveInlineEdit} className="p-1 text-green-600 hover:bg-green-100 rounded">
                                <Check className="w-3 h-3" />
                              </button>
                              <button onClick={cancelInlineEdit} className="p-1 text-red-600 hover:bg-red-100 rounded">
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                          ) : (
                            <>
                              {school.englishSetsIssued || 0}
                              <span className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-50">
                                <Edit2 className="w-3 h-3 text-blue-600" />
                              </span>
                            </>
                          )}
                        </td>
                        <td 
                          className="px-4 py-3 text-sm text-right text-gray-900 border-r border-black cursor-pointer hover:bg-blue-50 transition-colors relative group"
                          onClick={() => startInlineEdit(school.id, 'teluguSetsTakenBack', school.teluguSetsTakenBack || 0)}
                        >
                          {editingCell?.schoolId === school.id && editingCell?.field === 'teluguSetsTakenBack' ? (
                            <div className="flex items-center justify-end gap-1">
                              <input
                                type="number"
                                value={editingCellValue}
                                onChange={(e) => setEditingCellValue(e.target.value)}
                                onKeyDown={handleInlineEditKeyPress}
                                onBlur={saveInlineEdit}
                                autoFocus
                                className="w-20 px-2 py-1 border-2 border-blue-500 rounded focus:outline-none text-right"
                                onClick={(e) => e.stopPropagation()}
                              />
                              <button onClick={saveInlineEdit} className="p-1 text-green-600 hover:bg-green-100 rounded">
                                <Check className="w-3 h-3" />
                              </button>
                              <button onClick={cancelInlineEdit} className="p-1 text-red-600 hover:bg-red-100 rounded">
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                          ) : (
                            <>
                              {school.teluguSetsTakenBack || 0}
                              <span className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-50">
                                <Edit2 className="w-3 h-3 text-blue-600" />
                              </span>
                            </>
                          )}
                        </td>
                        <td 
                          className="px-4 py-3 text-sm text-right text-gray-900 border-r border-black cursor-pointer hover:bg-blue-50 transition-colors relative group"
                          onClick={() => startInlineEdit(school.id, 'englishSetsTakenBack', school.englishSetsTakenBack || 0)}
                        >
                          {editingCell?.schoolId === school.id && editingCell?.field === 'englishSetsTakenBack' ? (
                            <div className="flex items-center justify-end gap-1">
                              <input
                                type="number"
                                value={editingCellValue}
                                onChange={(e) => setEditingCellValue(e.target.value)}
                                onKeyDown={handleInlineEditKeyPress}
                                onBlur={saveInlineEdit}
                                autoFocus
                                className="w-20 px-2 py-1 border-2 border-blue-500 rounded focus:outline-none text-right"
                                onClick={(e) => e.stopPropagation()}
                              />
                              <button onClick={saveInlineEdit} className="p-1 text-green-600 hover:bg-green-100 rounded">
                                <Check className="w-3 h-3" />
                              </button>
                              <button onClick={cancelInlineEdit} className="p-1 text-red-600 hover:bg-red-100 rounded">
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                          ) : (
                            <>
                              {school.englishSetsTakenBack || 0}
                              <span className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-50">
                                <Edit2 className="w-3 h-3 text-blue-600" />
                              </span>
                            </>
                          )}
                        </td>
                        <td 
                          className="px-4 py-3 text-sm text-right text-green-700 font-medium border-r border-black cursor-pointer hover:bg-blue-50 transition-colors relative group"
                          onClick={() => startInlineEdit(school.id, 'moneyCollected', school.moneyCollected || 0)}
                        >
                          {editingCell?.schoolId === school.id && editingCell?.field === 'moneyCollected' ? (
                            <div className="flex items-center justify-end gap-1">
                              <span className="text-green-700">₹</span>
                              <input
                                type="number"
                                value={editingCellValue}
                                onChange={(e) => setEditingCellValue(e.target.value)}
                                onKeyDown={handleInlineEditKeyPress}
                                onBlur={saveInlineEdit}
                                autoFocus
                                className="w-24 px-2 py-1 border-2 border-blue-500 rounded focus:outline-none text-right"
                                onClick={(e) => e.stopPropagation()}
                              />
                              <button onClick={saveInlineEdit} className="p-1 text-green-600 hover:bg-green-100 rounded">
                                <Check className="w-3 h-3" />
                              </button>
                              <button onClick={cancelInlineEdit} className="p-1 text-red-600 hover:bg-red-100 rounded">
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                          ) : (
                            <>
                              ₹{school.moneyCollected.toLocaleString()}
                              <span className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-50">
                                <Edit2 className="w-3 h-3 text-blue-600" />
                              </span>
                            </>
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm text-right border-r border-black">
                          <span className={`font-medium ${calculateMoneyDifference(school) >= 0 ? 'text-red-600' : 'text-green-600'}`}>
                            ₹{calculateMoneyDifference(school).toLocaleString()}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-center space-x-2">
                            <button
                              onClick={() => {
                                setEditingItem(school);
                                // Clear undo history when starting a new edit
                                setUndoHistory([]);
                                setCanUndo(false);
                                // Map old contactPerson/contactNumber to new format for backward compatibility
                                // Also map legacy announcementStatus to activity
                                const formData = {
                                  ...school,
                                  activity: getSchoolActivity(school), // Normalize legacy values
                                  contact_person_1_name: school.contact_person_1_name || school.contactPerson || '',
                                  contact_person_1_phone: school.contact_person_1_phone || school.contactNumber || '',
                                  contact_person_2_name: school.contact_person_2_name || '',
                                  contact_person_2_phone: school.contact_person_2_phone || '',
                                  contact_person_3_name: school.contact_person_3_name || '',
                                  contact_person_3_phone: school.contact_person_3_phone || ''
                                };
                                setSchoolForm(formData);
                                setModalType('school');
                                setShowModal(true);
                              }}
                              className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                              title="Edit"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => {
                                setEditingItem(school);
                                setModalType('viewSchool');
                                setShowModal(true);
                              }}
                              className="p-1 text-green-600 hover:bg-green-50 rounded"
                              title="View Details"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => deleteSchool(school.id)}
                              className="p-1 text-red-600 hover:bg-red-50 rounded"
                              title="Delete"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                
                {getFilteredSchools().length === 0 && (
                  <div className="text-center py-12 text-gray-500">
                    <BookOpen className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No schools found</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* School Updates View */}
        {activeView === 'schoolUpdates' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-800">School Updates</h2>
              <div className="flex items-center space-x-2 text-orange-600">
                <Package className="w-6 h-6" />
                <span className="text-sm font-medium">Incremental Updates History</span>
              </div>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-lg shadow-md p-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Search School</label>
                  <input
                    type="text"
                    placeholder="Search by school or area..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                  />
                </div>

                {currentUser.role === 'admin' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Filter by Team</label>
                    <select
                      value={selectedTeam || ''}
                      onChange={(e) => setSelectedTeam(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                    >
                      <option value="">All Teams</option>
                      {teams.map(team => (
                        <option key={team.id} value={team.id}>{team.name}</option>
                      ))}
                    </select>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Filter by Date Range</label>
                  <input
                    type="date"
                    value={dateFilter.start}
                    onChange={(e) => setDateFilter({...dateFilter, start: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                    placeholder="Start Date"
                  />
                </div>
              </div>
            </div>

            {/* Updates List */}
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 border-b bg-gray-50">
                <div>
                  <h3 className="text-lg font-semibold text-gray-800">School Updates</h3>
                  <p className="text-sm text-gray-500">Incremental updates history</p>
                </div>
                <button
                  onClick={() => exportTableToCSV('school-updates-table', 'school_updates')}
                  className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
                >
                  <Download className="w-4 h-4" />
                  <span>Export CSV</span>
                </button>
              </div>
              <div className="overflow-x-auto">
                <table id="school-updates-table" className="w-full min-w-[700px]">
                  <thead className="bg-orange-100">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Date</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Time</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">School</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Area</th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700 uppercase">Telugu Distributed</th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700 uppercase">English Distributed</th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700 uppercase">Telugu Issued</th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700 uppercase">English Issued</th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700 uppercase">Telugu Taken Back</th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700 uppercase">English Taken Back</th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700 uppercase">Free Sets</th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700 uppercase">Money Collected</th>
                      {currentUser.role === 'admin' && (
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Team</th>
                      )}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {(() => {
                      // Get all schools that have updates
                      const schoolsWithUpdates = schools
                        .filter(school => school.updates && school.updates.length > 0)
                        .filter(school => {
                          if (currentUser.role === 'admin' && selectedTeam) return school.teamId === selectedTeam;
                          if (currentUser.role === 'team') return school.teamId === currentUser.uid;
                          return true;
                        })
                        .filter(school => {
                          const searchLower = searchTerm.toLowerCase();
                          return searchLower === '' || school.schoolName.toLowerCase().includes(searchLower) || school.areaName.toLowerCase().includes(searchLower);
                        })
                        .filter(school => {
                          if (dateFilter.start && dateFilter.end) {
                            return school.updates.some(update => {
                              const updateDate = new Date(update.date);
                              return updateDate >= new Date(dateFilter.start) && updateDate <= new Date(dateFilter.end);
                            });
                          } else if (dateFilter.start) {
                            return school.updates.some(update => new Date(update.date) >= new Date(dateFilter.start));
                          }
                          return true;
                        });

                      // Flatten updates into one row per update object (batch) and pivot fields as columns
                      const allUpdates = schoolsWithUpdates.flatMap(school =>
                        (school.updates || []).map(update => {
                          const isLegacy = !!update.field;
                          const base = {
                            schoolId: school.id,
                            schoolName: school.schoolName,
                            areaName: school.areaName,
                            teamId: school.teamId,
                            teamName: teams.find(t => t.id === school.teamId)?.name || 'Unknown',
                            date: update.date,
                            timestamp: update.timestamp
                          };

                          if (isLegacy) {
                            return {
                              ...base,
                              teluguSetsDistributed: update.field === 'teluguSetsDistributed' ? Number(update.value) : 0,
                              englishSetsDistributed: update.field === 'englishSetsDistributed' ? Number(update.value) : 0,
                              teluguSetsIssued: update.field === 'teluguSetsIssued' ? Number(update.value) : 0,
                              englishSetsIssued: update.field === 'englishSetsIssued' ? Number(update.value) : 0,
                              teluguSetsTakenBack: update.field === 'teluguSetsTakenBack' ? Number(update.value) : 0,
                              englishSetsTakenBack: update.field === 'englishSetsTakenBack' ? Number(update.value) : 0,
                              freeSetsGiven: update.field === 'freeSetsGiven' ? Number(update.value) : 0,
                              moneyCollected: update.field === 'moneyCollected' ? Number(update.value) : 0
                            };
                          }

                          // Batch update object: map known keys
                          return {
                            ...base,
                            teluguSetsDistributed: Number(update.teluguSetsDistributed) || 0,
                            englishSetsDistributed: Number(update.englishSetsDistributed) || 0,
                            teluguSetsIssued: Number(update.teluguSetsIssued) || 0,
                            englishSetsIssued: Number(update.englishSetsIssued) || 0,
                            teluguSetsTakenBack: Number(update.teluguSetsTakenBack) || 0,
                            englishSetsTakenBack: Number(update.englishSetsTakenBack) || 0,
                            freeSetsGiven: Number(update.freeSetsGiven) || 0,
                            moneyCollected: Number(update.moneyCollected) || 0
                          };
                        })
                      );

                      // Sort by timestamp (newest first)
                      allUpdates.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

                      if (allUpdates.length === 0) {
                        return (
                          <tr>
                            <td colSpan={currentUser.role === 'admin' ? 13 : 12} className="px-4 py-12 text-center text-gray-500">
                              <Package className="w-12 h-12 mx-auto mb-4 opacity-50" />
                              <p>No updates found</p>
                            </td>
                          </tr>
                        );
                      }

                      return allUpdates.map((u, idx) => (
                        <tr key={idx} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm text-gray-600">{new Date(u.date).toLocaleDateString()}</td>
                          <td className="px-4 py-3 text-sm text-gray-600">{new Date(u.timestamp).toLocaleTimeString()}</td>
                          <td className="px-4 py-3 text-sm font-medium text-gray-900">{u.schoolName}</td>
                          <td className="px-4 py-3 text-sm text-gray-600">{u.areaName}</td>
                          <td className="px-4 py-3 text-sm text-right font-semibold text-green-600">{u.teluguSetsDistributed || 0}</td>
                          <td className="px-4 py-3 text-sm text-right font-semibold text-green-600">{u.englishSetsDistributed || 0}</td>
                          <td className="px-4 py-3 text-sm text-right font-semibold text-blue-600">{u.teluguSetsIssued || 0}</td>
                          <td className="px-4 py-3 text-sm text-right font-semibold text-blue-600">{u.englishSetsIssued || 0}</td>
                          <td className="px-4 py-3 text-sm text-right font-semibold text-red-600">{u.teluguSetsTakenBack || 0}</td>
                          <td className="px-4 py-3 text-sm text-right font-semibold text-red-600">{u.englishSetsTakenBack || 0}</td>
                          <td className="px-4 py-3 text-sm text-right font-semibold text-blue-600">{u.freeSetsGiven || 0}</td>
                          <td className="px-4 py-3 text-sm text-right font-semibold text-green-700">{u.moneyCollected ? `₹${u.moneyCollected.toLocaleString()}` : 0}</td>
                          {currentUser.role === 'admin' && (
                            <td className="px-4 py-3 text-sm text-gray-600">{u.teamName}</td>
                          )}
                        </tr>
                      ));
                    })()}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Requirements View (Admin Only) */}
        {activeView === 'requirements' && currentUser.role === 'admin' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-800">Set Requirements</h2>

            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 border-b bg-gray-50">
                <div>
                  <h3 className="text-lg font-semibold text-gray-800">Requirements</h3>
                  <p className="text-sm text-gray-500">All team requirement requests</p>
                </div>
                <button
                  onClick={() => exportTableToCSV('requirements-table', 'requirements')}
                  className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
                >
                  <Download className="w-4 h-4" />
                  <span>Export CSV</span>
                </button>
              </div>
              <table id="requirements-table" className="w-full min-w-[700px]">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Date</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Team</th>
                    <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">Gita Telugu</th>
                    <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">Gita English</th>
                    <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">Booklet Telugu</th>
                    <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">Booklet English</th>
                    <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">Calendar</th>
                    <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">Chikki</th>
                    <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">Total</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Reason</th>
                    <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">Status</th>
                    <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {requirements.map(req => (
                    <tr key={req.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm text-gray-600">{req.date}</td>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        {teams.find(t => t.id === req.teamId)?.name}
                      </td>
                      <td className="px-4 py-3 text-sm text-right text-gray-900 font-medium">{req.gitaTelugu || 0}</td>
                      <td className="px-4 py-3 text-sm text-right text-gray-900 font-medium">{req.gitaEnglish || 0}</td>
                      <td className="px-4 py-3 text-sm text-right text-gray-900 font-medium">{req.bookletTelugu || 0}</td>
                      <td className="px-4 py-3 text-sm text-right text-gray-900 font-medium">{req.bookletEnglish || 0}</td>
                      <td className="px-4 py-3 text-sm text-right text-gray-900 font-medium">{req.calendar || 0}</td>
                      <td className="px-4 py-3 text-sm text-right text-gray-900 font-medium">{req.chikki || 0}</td>
                      <td className="px-4 py-3 text-sm text-right text-green-700 font-semibold">
                        {(req.gitaTelugu || 0) + (req.gitaEnglish || 0) + (req.bookletTelugu || 0) + 
                         (req.bookletEnglish || 0) + (req.calendar || 0) + (req.chikki || 0)}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">{req.reason}</td>
                      <td className="px-4 py-3 text-center">
                        <span className={`px-3 py-1 text-xs rounded-full ${
                          req.status === 'approved' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                        }`}>
                          {req.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        {req.status === 'pending' && (
                          <button
                            onClick={() => approveRequirement(req.id)}
                            className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700 transition-colors"
                          >
                            Approve
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              
              {requirements.length === 0 && (
                <div className="text-center py-12 text-gray-500">
                  <Package className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No requirements raised</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Money Settlements View */}
        {activeView === 'settlements' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-800">
                {currentUser.role === 'admin' ? 'Money Settlements' : 'Submit Money Settlement'}
              </h2>
              {(currentUser.role === 'team' || currentUser.role === 'admin') && (
                <button
                  onClick={() => {
                    setModalType('settlement');
                    resetSettlementForm();
                    setShowModal(true);
                  }}
                  className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
                >
                  <DollarSign className="w-4 h-4" />
                  <span>{currentUser.role === 'admin' ? 'Submit Settlement on Behalf of Team' : 'Submit Settlement'}</span>
                </button>
              )}
            </div>

            {currentUser.role === 'admin' ? (
              <>
                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  {(() => {
                    const stats = getSettlementSummaryStats();
                    return (
                      <>
                        <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg shadow-md p-6 border border-purple-200">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-xs font-medium uppercase text-purple-700 mb-1">Total Expected Settlement</p>
                              <p className="text-2xl font-bold text-purple-900">₹{stats.totalExpected.toLocaleString()}</p>
                              <p className="text-xs text-purple-600 mt-1">From all teams</p>
                            </div>
                            <div className="bg-purple-200 p-3 rounded-full">
                              <DollarSign className="w-6 h-6 text-purple-700" />
                            </div>
                          </div>
                        </div>
                        
                        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg shadow-md p-6 border border-green-200">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-xs font-medium uppercase text-green-700 mb-1">Total Money Settled</p>
                              <p className="text-2xl font-bold text-green-900">₹{stats.totalSettled.toLocaleString()}</p>
                              <p className="text-xs text-green-600 mt-1">Approved settlements</p>
                            </div>
                            <div className="bg-green-200 p-3 rounded-full">
                              <Check className="w-6 h-6 text-green-700" />
                            </div>
                          </div>
                        </div>
                        
                        <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-lg shadow-md p-6 border border-yellow-200">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-xs font-medium uppercase text-yellow-700 mb-1">Pending Approvals</p>
                              <p className="text-2xl font-bold text-yellow-900">{stats.pendingCount}</p>
                              <p className="text-xs text-yellow-600 mt-1">₹{stats.pendingAmount.toLocaleString()} awaiting</p>
                            </div>
                            <div className="bg-yellow-200 p-3 rounded-full">
                              <Clock className="w-6 h-6 text-yellow-700" />
                            </div>
                          </div>
                        </div>
                      </>
                    );
                  })()}
                </div>

                {/* Money Settlement Summary Table */}
                <div className="bg-white rounded-lg shadow-md overflow-hidden">
                  <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-orange-50 border-b">
                    <div className="flex items-center gap-2 flex-1">
                      <button
                        onClick={() => setIsTeamSettlementSummaryCollapsed(!isTeamSettlementSummaryCollapsed)}
                        className="flex items-center justify-center w-8 h-8 hover:bg-orange-100 rounded transition-colors"
                      >
                        {isTeamSettlementSummaryCollapsed ? (
                          <ChevronDown className="w-5 h-5 text-orange-900" />
                        ) : (
                          <ChevronUp className="w-5 h-5 text-orange-900" />
                        )}
                      </button>
                      <div>
                        <h3 className="text-lg font-semibold text-orange-900">Team Settlement Summary</h3>
                        <p className="text-sm text-orange-700">Overview of settlements by team</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={reconcileTeamSettlements}
                        className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                        title="Recalculate and fix settlement totals based on approved settlements"
                      >
                        <AlertCircle className="w-4 h-4" />
                        <span>Fix Totals</span>
                      </button>
                      <button
                        onClick={() => exportTableToCSV('settlement-summary-table', 'settlement_summary')}
                        className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
                      >
                        <Download className="w-4 h-4" />
                        <span>Export CSV</span>
                      </button>
                    </div>
                  </div>
                  {!isTeamSettlementSummaryCollapsed && (
                  <div className="overflow-x-auto">
                    <table id="settlement-summary-table" className="w-full min-w-[700px]">
                      <thead className="bg-gray-50 border-b">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-700">Team</th>
                          <th className="px-4 py-3 text-right text-xs font-medium uppercase text-gray-700">Total Inventory Issued</th>
                          <th className="px-4 py-3 text-right text-xs font-medium uppercase text-gray-700">Expected Settlement (₹)</th>
                          <th className="px-4 py-3 text-right text-xs font-medium uppercase text-gray-700">Total Money Settled (₹)</th>
                          <th className="px-4 py-3 text-right text-xs font-medium uppercase text-gray-700">Total Expenses (₹)</th>
                          <th className="px-4 py-3 text-right text-xs font-medium uppercase text-gray-700">Balance (₹)</th>
                          <th className="px-4 py-3 text-center text-xs font-medium uppercase text-gray-700">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {getMoneySettlementSummary().map((summary, idx) => {
                          const maxBalance = Math.max(...getMoneySettlementSummary().map(s => Math.abs(s.balance)));
                          const balanceColorClass = getBalanceColor(summary.balance, maxBalance);
                          const trend = summary.balance > 0 ? 'up' : summary.balance < 0 ? 'down' : 'neutral';
                          
                          return (
                          <tr key={idx} className="hover:bg-gray-50 transition-colors">
                            <td className="px-4 py-3">
                              <div className="text-sm font-semibold text-gray-900">{summary.teamName}</div>
                            </td>
                            <td className="px-4 py-3 text-sm text-right text-gray-700">{summary.totalInventoryIssued}</td>
                            <td className="px-4 py-3 text-sm text-right text-purple-700 font-semibold">₹{summary.expectedSettlement.toLocaleString()}</td>
                            <td className="px-4 py-3 text-sm text-right text-green-700 font-semibold">₹{summary.totalMoneySettled.toLocaleString()}</td>
                            <td className="px-4 py-3 text-sm text-right text-red-700 font-semibold">₹{summary.totalExpenses.toLocaleString()}</td>
                            <td className={`px-4 py-3 text-right`}>
                              <div className={`inline-flex items-center gap-1 px-3 py-1 rounded-full ${balanceColorClass}`}>
                                {trend === 'up' && <TrendingUp className="w-3 h-3" />}
                                {trend === 'down' && <TrendingDown className="w-3 h-3" />}
                                <span className="text-sm font-bold">
                                  {summary.balance >= 0 ? '+' : ''}₹{summary.balance.toLocaleString()}
                                </span>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-center">
                              <button
                                onClick={() => setQuickViewSettlement(summary)}
                                className="p-1 hover:bg-blue-50 rounded-full transition-colors"
                                title="Quick View Details"
                              >
                                <Info className="w-4 h-4 text-blue-600" />
                              </button>
                            </td>
                          </tr>
                          );
                        })}
                      </tbody>
                      <tfoot className="bg-gray-100 border-t-2 border-gray-300">
                        {(() => {
                          const allSummaries = getMoneySettlementSummary();
                          const totalInventory = allSummaries.reduce((sum, s) => sum + s.totalInventoryIssued, 0);
                          const totalExpected = allSummaries.reduce((sum, s) => sum + s.expectedSettlement, 0);
                          const totalSettled = allSummaries.reduce((sum, s) => sum + s.totalMoneySettled, 0);
                          const totalExpenses = allSummaries.reduce((sum, s) => sum + s.totalExpenses, 0);
                          const overallBalance = totalExpected - totalSettled;
                          
                          return (
                            <tr className="font-bold">
                              <td className="px-4 py-3 text-sm text-gray-900 uppercase">Total</td>
                              <td className="px-4 py-3 text-sm text-right text-gray-900">{totalInventory.toLocaleString()}</td>
                              <td className="px-4 py-3 text-sm text-right text-purple-900">₹{totalExpected.toLocaleString()}</td>
                              <td className="px-4 py-3 text-sm text-right text-green-900">₹{totalSettled.toLocaleString()}</td>
                              <td className="px-4 py-3 text-sm text-right text-red-900">₹{totalExpenses.toLocaleString()}</td>
                              <td className={`px-4 py-3 text-sm text-right ${overallBalance >= 0 ? 'text-green-900' : 'text-red-900'}`}>
                                {overallBalance >= 0 ? '+' : ''}₹{overallBalance.toLocaleString()}
                              </td>
                            </tr>
                          );
                        })()}
                      </tfoot>
                    </table>
                  </div>
                  )}
                </div>

                {/* Inventory Issuance History Table */}
                <div className="bg-white rounded-lg shadow-md overflow-hidden">
                  <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-blue-50 border-b">
                    <div className="flex items-center gap-2 flex-1">
                      <button
                        onClick={() => setIsInventoryIssuanceHistoryCollapsed(!isInventoryIssuanceHistoryCollapsed)}
                        className="flex items-center justify-center w-8 h-8 hover:bg-blue-100 rounded transition-colors"
                      >
                        {isInventoryIssuanceHistoryCollapsed ? (
                          <ChevronDown className="w-5 h-5 text-blue-900" />
                        ) : (
                          <ChevronUp className="w-5 h-5 text-blue-900" />
                        )}
                      </button>
                      <div>
                        <h3 className="text-lg font-semibold text-blue-900">Inventory Issuance History</h3>
                        <p className="text-sm text-blue-700">Complete history of all inventory items issued to teams</p>
                      </div>
                    </div>
                    <button
                      onClick={() => exportTableToCSV('settlement-issuance-table', 'inventory_issuance')}
                      className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
                    >
                      <Download className="w-4 h-4" />
                      <span>Export CSV</span>
                    </button>
                  </div>
                  {!isInventoryIssuanceHistoryCollapsed && (
                  <>
                    {/* Date Range Filter */}
                    <div className="flex flex-wrap items-center gap-3 p-4 bg-blue-50 border-b">
                      <Calendar className="w-4 h-4 text-blue-700" />
                      <label className="text-sm font-medium text-blue-900">Filter by Date:</label>
                      <button
                        onClick={() => setInventoryDateFilter('all')}
                        className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                          inventoryDateFilter === 'all' 
                            ? 'bg-blue-600 text-white' 
                            : 'bg-white text-blue-700 border border-blue-300 hover:bg-blue-100'
                        }`}
                      >
                        All Time
                      </button>
                      <button
                        onClick={() => setInventoryDateFilter('recent')}
                        className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                          inventoryDateFilter === 'recent' 
                            ? 'bg-blue-600 text-white' 
                            : 'bg-white text-blue-700 border border-blue-300 hover:bg-blue-100'
                        }`}
                      >
                        Recent (Last 7 Days)
                      </button>
                      <button
                        onClick={() => setInventoryDateFilter('custom')}
                        className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                          inventoryDateFilter === 'custom' 
                            ? 'bg-blue-600 text-white' 
                            : 'bg-white text-blue-700 border border-blue-300 hover:bg-blue-100'
                        }`}
                      >
                        Custom Range
                      </button>
                      {inventoryDateFilter === 'custom' && (
                        <>
                          <input
                            type="date"
                            value={inventoryDateRange.start}
                            onChange={(e) => setInventoryDateRange({...inventoryDateRange, start: e.target.value})}
                            className="px-3 py-1.5 border border-blue-300 rounded-md text-sm"
                          />
                          <span className="text-blue-700">to</span>
                          <input
                            type="date"
                            value={inventoryDateRange.end}
                            onChange={(e) => setInventoryDateRange({...inventoryDateRange, end: e.target.value})}
                            className="px-3 py-1.5 border border-blue-300 rounded-md text-sm"
                          />
                        </>
                      )}
                    </div>
                    <div className="overflow-x-auto">
                    <table id="settlement-issuance-table" className="w-full min-w-[700px]">
                      <thead className="bg-gray-50 border-b">
                        <tr>
                          <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Date Issued</th>
                          <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Team</th>
                          <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">Gita Telugu</th>
                          <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">Booklet Telugu</th>
                          <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">Gita English</th>
                          <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">Booklet English</th>
                          <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">Calendar</th>
                          <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">Chikki</th>
                          <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">Pamphlets</th>
                          <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">Total Items</th>
                          <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Contact Person</th>
                          <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Phone Number</th>
                          <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {(() => {
                          // Get all issuance history from all teams
                          const allIssues = teams.flatMap(team => {
                            const issueHistory = team.issueHistory || [];
                            return issueHistory.map(issue => ({
                              ...issue,
                              teamName: team.name,
                              teamId: team.id
                            }));
                          });

                          // Sort by date (newest first)
                          allIssues.sort((a, b) => new Date(b.issuedDate) - new Date(a.issuedDate));

                          if (allIssues.length === 0) {
                            return (
                              <tr>
                                <td colSpan="13" className="px-4 py-12 text-center text-gray-500">
                                  <Package className="w-12 h-12 mx-auto mb-4 opacity-50" />
                                  <p>No inventory issuance records found</p>
                                </td>
                              </tr>
                            );
                          }

                          return allIssues.map((issue, idx) => {
                            const totalItems = (parseInt(issue.gitaTelugu) || 0) + 
                                             (parseInt(issue.bookletTelugu) || 0) +
                                             (parseInt(issue.gitaEnglish) || 0) +
                                             (parseInt(issue.bookletEnglish) || 0) +
                                             (parseInt(issue.calendar) || 0) +
                                             (parseInt(issue.chikki) || 0) +
                                             (parseInt(issue.pamphlets) || 0);
                            
                            return (
                              <tr key={idx} className="hover:bg-gray-50">
                                <td className="px-4 py-3 text-sm text-gray-600">{new Date(issue.issuedDate).toLocaleDateString()}</td>
                                <td className="px-4 py-3 text-sm font-medium text-gray-900">{issue.teamName}</td>
                                <td className="px-4 py-3 text-sm text-right text-gray-700">{issue.gitaTelugu || 0}</td>
                                <td className="px-4 py-3 text-sm text-right text-gray-700">{issue.bookletTelugu || 0}</td>
                                <td className="px-4 py-3 text-sm text-right text-gray-700">{issue.gitaEnglish || 0}</td>
                                <td className="px-4 py-3 text-sm text-right text-gray-700">{issue.bookletEnglish || 0}</td>
                                <td className="px-4 py-3 text-sm text-right text-gray-700">{issue.calendar || 0}</td>
                                <td className="px-4 py-3 text-sm text-right text-gray-700">{issue.chikki || 0}</td>
                                <td className="px-4 py-3 text-sm text-right text-gray-700">{issue.pamphlets || 0}</td>
                                <td className="px-4 py-3 text-sm text-right font-semibold text-green-700">{totalItems}</td>
                                <td className="px-4 py-3 text-sm text-gray-700">{issue.contactPerson || 'N/A'}</td>
                                <td className="px-4 py-3 text-sm text-gray-700">{issue.contactPhone || 'N/A'}</td>
                                <td className="px-4 py-3 text-center">
                                  <button
                                    onClick={() => deleteInventoryIssuance(issue.teamId, issue)}
                                    className="p-1 text-red-600 hover:bg-red-50 rounded"
                                    title="Delete Issuance"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </td>
                              </tr>
                            );
                          });
                        })()}
                      </tbody>
                    </table>
                  </div>
                  </>
                  )}
                </div>

                {/* Individual Settlement Requests */}
                <div className="bg-white rounded-lg shadow-md overflow-hidden">
                  <div className="flex flex-wrap items-center justify-between gap-3 p-4 border-b bg-gray-50">
                    <div className="flex items-center gap-2 flex-1">
                      <button
                        onClick={() => setIsPendingSettlementRequestsCollapsed(!isPendingSettlementRequestsCollapsed)}
                        className="flex items-center justify-center w-8 h-8 hover:bg-gray-100 rounded transition-colors"
                      >
                        {isPendingSettlementRequestsCollapsed ? (
                          <ChevronDown className="w-5 h-5 text-gray-800" />
                        ) : (
                          <ChevronUp className="w-5 h-5 text-gray-800" />
                        )}
                      </button>
                      <h3 className="text-lg font-semibold text-gray-800">Pending Settlement Requests</h3>
                    </div>
                    <button
                      onClick={() => exportTableToCSV('pending-settlements-table', 'pending_settlements')}
                      className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
                    >
                      <Download className="w-4 h-4" />
                      <span>Export CSV</span>
                    </button>
                  </div>
                  {!isPendingSettlementRequestsCollapsed && (
                  <>
                    {/* Filters */}
                    <div className="flex flex-wrap items-center gap-3 p-4 bg-gray-50 border-b">
                      <div className="flex items-center gap-2">
                        <Filter className="w-4 h-4 text-gray-600" />
                        <label className="text-sm font-medium text-gray-700">Status:</label>
                        <select
                          value={settlementStatusFilter}
                          onChange={(e) => setSettlementStatusFilter(e.target.value)}
                          className="px-3 py-1.5 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="all">All</option>
                          <option value="pending">Pending</option>
                          <option value="approved">Approved</option>
                          <option value="declined">Declined</option>
                        </select>
                      </div>
                      <div className="flex items-center gap-2">
                        <label className="text-sm font-medium text-gray-700">Method:</label>
                        <select
                          value={settlementMethodFilter}
                          onChange={(e) => setSettlementMethodFilter(e.target.value)}
                          className="px-3 py-1.5 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="all">All</option>
                          <option value="Cash">Cash</option>
                          <option value="Bank Transfer">Bank Transfer</option>
                          <option value="UPI">UPI</option>
                          <option value="Cheque">Cheque</option>
                        </select>
                      </div>
                    </div>
                    <div className="overflow-x-auto">
                      <table id="pending-settlements-table" className="w-full min-w-[700px]">
                        <thead className="bg-gray-50 border-b">
                          <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-700">Date</th>
                            <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-700">Team</th>
                            <th className="px-4 py-3 text-right text-xs font-medium uppercase text-gray-700">Amount</th>
                            <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-700">Method</th>
                            <th className="px-4 py-3 text-center text-xs font-medium uppercase text-gray-700">Status</th>
                            <th className="px-4 py-3 text-center text-xs font-medium uppercase text-gray-700">Action</th>
                            <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-700">Comments</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y">
                          {(() => {
                            // Filter and sort settlements
                            let filteredSettlements = [...moneySettlements];
                            
                            // Filter by status
                            if (settlementStatusFilter !== 'all') {
                              filteredSettlements = filteredSettlements.filter(s => s.status === settlementStatusFilter);
                            }
                            
                            // Filter by method
                            if (settlementMethodFilter !== 'all') {
                              filteredSettlements = filteredSettlements.filter(s => s.paymentMethod === settlementMethodFilter);
                            }
                            
                            // Sort by date (newest first)
                            filteredSettlements.sort((a, b) => {
                              const dateA = new Date(a.date || a.createdAt || 0);
                              const dateB = new Date(b.date || b.createdAt || 0);
                              return dateB - dateA; // Newest first
                            });
                            
                            return filteredSettlements.length === 0 ? (
                              <tr>
                                <td colSpan="7" className="px-4 py-12 text-center text-gray-500">
                                  <DollarSign className="w-12 h-12 mx-auto mb-4 opacity-50" />
                                  <p>No money settlements found</p>
                                </td>
                              </tr>
                            ) : (
                              filteredSettlements.map(settlement => {
                                const timeAgo = getTimeAgo(settlement.date || settlement.createdAt);
                                const daysSinceSubmission = Math.floor((new Date() - new Date(settlement.date || settlement.createdAt)) / (1000 * 60 * 60 * 24));
                                const isOld = settlement.status === 'pending' && daysSinceSubmission > 7;
                                
                                return (
                                <tr key={settlement.id} className={`hover:bg-gray-50 transition-colors ${isOld ? 'bg-red-50' : ''}`}>
                                  <td className="px-4 py-3">
                                    <div className="text-sm text-gray-900">{settlement.date}</div>
                                    <div className="text-xs text-gray-500 flex items-center gap-1">
                                      <Clock className="w-3 h-3" />
                                      {timeAgo}
                                      {isOld && (
                                        <span className="ml-1 px-1.5 py-0.5 bg-red-200 text-red-800 text-xs rounded-full font-semibold">
                                          URGENT
                                        </span>
                                      )}
                                    </div>
                                  </td>
                                  <td className="px-4 py-3 text-sm font-medium text-gray-900">{settlement.teamName}</td>
                                  <td className="px-4 py-3 text-sm text-right text-green-700 font-semibold">₹{settlement.amount.toLocaleString()}</td>
                                  <td className="px-4 py-3 text-sm text-gray-700">{settlement.paymentMethod}</td>
                                  <td className="px-4 py-3 text-center">
                                    <span className={`px-3 py-1 text-xs rounded-full font-medium ${
                                      settlement.status === 'approved' ? 'bg-green-100 text-green-700' : 
                                      settlement.status === 'declined' ? 'bg-red-100 text-red-700' : 
                                      'bg-yellow-100 text-yellow-700'
                                    }`}>
                                      {settlement.status}
                                    </span>
                                  </td>
                                  <td className="px-4 py-3 text-center">
                                    {settlement.status === 'pending' && (
                                      <div className="flex items-center justify-center gap-2">
                                        <button
                                          onClick={() => approveMoneySettlement(settlement.id)}
                                          className="p-1.5 bg-green-600 text-white text-xs rounded hover:bg-green-700 transition-colors flex items-center gap-1"
                                          title="Approve"
                                        >
                                          <Check className="w-3 h-3" />
                                        </button>
                                        <button
                                          onClick={() => declineMoneySettlement(settlement.id)}
                                          className="p-1.5 bg-red-600 text-white text-xs rounded hover:bg-red-700 transition-colors flex items-center gap-1"
                                          title="Decline"
                                        >
                                          <X className="w-3 h-3" />
                                        </button>
                                      </div>
                                    )}
                                  </td>
                                  <td className="px-4 py-3 text-sm text-gray-700">
                                    {settlement.notes?.trim() ? settlement.notes : '-'}
                                  </td>
                                </tr>
                                );
                              })
                            );
                          })()}
                        </tbody>
                      </table>
                    </div>
                  </>
                  )}
                </div>
              </>
            ) : (
              <>
                {/* Team Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  {(() => {
                    const teamSettlements = moneySettlements.filter(s => s.teamId === currentUser.teamId);
                    const totalSettled = teamSettlements
                      .filter(s => s.status === 'approved')
                      .reduce((sum, s) => sum + (s.amount || 0), 0);
                    const pendingAmount = teamSettlements
                      .filter(s => s.status === 'pending')
                      .reduce((sum, s) => sum + (s.amount || 0), 0);
                    
                    return (
                      <>
                        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg shadow-md p-6 border border-blue-200">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-xs font-medium uppercase text-blue-700 mb-1">Your Total Settlements</p>
                              <p className="text-2xl font-bold text-blue-900">₹{totalSettled.toLocaleString()}</p>
                              <p className="text-xs text-blue-600 mt-1">All time approved</p>
                            </div>
                            <div className="bg-blue-200 p-3 rounded-full">
                              <DollarSign className="w-6 h-6 text-blue-700" />
                            </div>
                          </div>
                        </div>
                        
                        <div className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-lg shadow-md p-6 border border-amber-200">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-xs font-medium uppercase text-amber-700 mb-1">Pending Settlement</p>
                              <p className="text-2xl font-bold text-amber-900">₹{pendingAmount.toLocaleString()}</p>
                              <p className="text-xs text-amber-600 mt-1">Awaiting approval</p>
                            </div>
                            <div className="bg-amber-200 p-3 rounded-full">
                              <Clock className="w-6 h-6 text-amber-700" />
                            </div>
                          </div>
                        </div>
                      </>
                    );
                  })()}
                </div>

                <div className="bg-white rounded-lg shadow-md overflow-hidden">
                  <div className="p-6 border-b bg-gray-50">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">Your Settlement History</h3>
                  {/* Filters */}
                  <div className="flex flex-wrap items-center gap-3">
                    <div className="flex items-center gap-2">
                      <Filter className="w-4 h-4 text-gray-600" />
                      <label className="text-sm font-medium text-gray-700">Status:</label>
                      <select
                        value={settlementStatusFilter}
                        onChange={(e) => setSettlementStatusFilter(e.target.value)}
                        className="px-3 py-1.5 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="all">All</option>
                        <option value="pending">Pending</option>
                        <option value="approved">Approved</option>
                        <option value="declined">Declined</option>
                      </select>
                    </div>
                    <div className="flex items-center gap-2">
                      <label className="text-sm font-medium text-gray-700">Method:</label>
                      <select
                        value={settlementMethodFilter}
                        onChange={(e) => setSettlementMethodFilter(e.target.value)}
                        className="px-3 py-1.5 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="all">All</option>
                        <option value="Cash">Cash</option>
                        <option value="Bank Transfer">Bank Transfer</option>
                        <option value="UPI">UPI</option>
                        <option value="Cheque">Cheque</option>
                      </select>
                    </div>
                  </div>
                </div>
                <div className="p-6">
                  <div className="space-y-3">
                    {(() => {
                      // Filter and sort settlements for team user
                      let filteredSettlements = moneySettlements.filter(s => s.teamId === currentUser.teamId);
                      
                      // Filter by status
                      if (settlementStatusFilter !== 'all') {
                        filteredSettlements = filteredSettlements.filter(s => s.status === settlementStatusFilter);
                      }
                      
                      // Filter by method
                      if (settlementMethodFilter !== 'all') {
                        filteredSettlements = filteredSettlements.filter(s => s.paymentMethod === settlementMethodFilter);
                      }
                      
                      // Sort by date (newest first)
                      filteredSettlements.sort((a, b) => {
                        const dateA = new Date(a.date || a.createdAt || 0);
                        const dateB = new Date(b.date || b.createdAt || 0);
                        return dateB - dateA; // Newest first
                      });
                      
                      if (filteredSettlements.length === 0) {
                        return (
                          <div className="text-center py-8 text-gray-500">
                            <DollarSign className="w-8 h-8 mx-auto mb-2 opacity-50" />
                            <p>No settlements found</p>
                          </div>
                        );
                      }
                      
                      return filteredSettlements.map(settlement => (
                        <div key={settlement.id} className="border rounded-lg p-4">
                          <div className="flex justify-between items-center">
                            <div>
                              <p className="font-medium text-gray-800">₹{settlement.amount.toLocaleString()}</p>
                              <p className="text-sm text-gray-600">{settlement.paymentMethod} • {settlement.date}</p>
                            </div>
                            <span className={`px-3 py-1 text-xs rounded-full ${
                              settlement.status === 'approved' ? 'bg-green-100 text-green-700' : 
                              settlement.status === 'declined' ? 'bg-red-100 text-red-700' : 
                              'bg-yellow-100 text-yellow-700'
                            }`}>
                              {settlement.status}
                            </span>
                          </div>
                          {settlement.notes && (
                            <p className="text-sm text-gray-600 mt-2">{settlement.notes}</p>
                          )}
                        </div>
                      ));
                    })()}
                  </div>
                </div>
              </div>
              </>
            )}
          </div>
        )}

        {/* Expenses View */}
        {activeView === 'expenses' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-800">Expenses</h2>
              <button
                onClick={() => {
                  setModalType('expense');
                  setExpenseForm({
                    amount: 0,
                    description: '',
                    date: new Date().toISOString().split('T')[0],
                    category: 'Other'
                  });
                  setShowModal(true);
                }}
                className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>Add Expense</span>
              </button>
            </div>

            {currentUser.role === 'admin' ? (
              <>
                {/* Admin Account Summary */}
                <div className="bg-white rounded-lg shadow-md p-6">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">Admin Account Summary</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-green-50 p-4 rounded-lg">
                      <p className="text-sm text-gray-600">Total Received</p>
                      <p className="text-2xl font-bold text-green-700">₹{adminAccount.totalReceived.toLocaleString()}</p>
                    </div>
                    <div className="bg-red-50 p-4 rounded-lg">
                      <p className="text-sm text-gray-600">Total Expenses</p>
                      <p className="text-2xl font-bold text-red-700">₹{adminAccount.totalExpenses.toLocaleString()}</p>
                    </div>
                    <div className={`p-4 rounded-lg ${adminAccount.balance >= 0 ? 'bg-blue-50' : 'bg-orange-50'}`}>
                      <p className="text-sm text-gray-600">Balance</p>
                      <p className={`text-2xl font-bold ${adminAccount.balance >= 0 ? 'text-blue-700' : 'text-orange-700'}`}>
                        ₹{adminAccount.balance.toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Bank Submissions Table */}
                <div className="bg-white rounded-lg shadow-md overflow-hidden">
                  <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-blue-50 border-b">
                    <div>
                      <h3 className="text-lg font-semibold text-blue-900">Bank Submissions</h3>
                      <p className="text-sm text-blue-700">History of amounts submitted to bank</p>
                    </div>
                    <button
                      onClick={() => {
                        setModalType('bankSubmission');
                        setBankSubmissionForm({
                          amount: 0,
                          date: new Date().toISOString().split('T')[0],
                          notes: ''
                        });
                        setShowModal(true);
                      }}
                      className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Submit to Bank</span>
                    </button>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[600px]">
                      <thead className="bg-gray-50 border-b">
                        <tr>
                          <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Date</th>
                          <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">Amount (₹)</th>
                          <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Notes</th>
                          <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">Expenses Till Date (₹)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {bankSubmissions.sort((a, b) => new Date(b.date) - new Date(a.date)).map(submission => {
                          const expensesTillDate = getAdminExpensesTillBankSubmission(submission.date)
                            .reduce((sum, e) => sum + (parseFloat(e.amount) || 0), 0);
                          return (
                            <tr key={submission.id} className="hover:bg-gray-50">
                              <td className="px-4 py-3 text-sm text-gray-600">{submission.date}</td>
                              <td className="px-4 py-3 text-sm text-right text-green-700 font-semibold">₹{parseFloat(submission.amount).toLocaleString()}</td>
                              <td className="px-4 py-3 text-sm text-gray-700">{submission.notes || 'N/A'}</td>
                              <td className="px-4 py-3 text-sm text-right text-red-700 font-semibold">₹{expensesTillDate.toLocaleString()}</td>
                            </tr>
                          );
                        })}
                        {bankSubmissions.length === 0 && (
                          <tr>
                            <td colSpan="4" className="px-4 py-12 text-center text-gray-500">
                              <DollarSign className="w-12 h-12 mx-auto mb-4 opacity-50" />
                              <p>No bank submissions recorded</p>
                            </td>
                          </tr>
                        )}
                      </tbody>
                      <tfoot className="bg-gray-50">
                        <tr>
                          <td colSpan="3" className="px-4 py-3 text-sm font-semibold text-gray-700 text-right">Grand Total Expenses:</td>
                          <td className="px-4 py-3 text-sm text-right font-bold text-red-700">₹{getTotalAdminExpenses().toLocaleString()}</td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>

                {/* Admin Expenses Table */}
                <div className="bg-white rounded-lg shadow-md overflow-hidden">
                  <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-red-50 border-b">
                    <div>
                      <h3 className="text-lg font-semibold text-red-900">All Expenses</h3>
                      <p className="text-sm text-red-700">Complete history of all expenses</p>
                    </div>
                    <button
                      onClick={() => exportTableToCSV('admin-expenses-table', 'admin_expenses')}
                      className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
                    >
                      <Download className="w-4 h-4" />
                      <span>Export CSV</span>
                    </button>
                  </div>
                  <div className="overflow-x-auto">
                    <table id="admin-expenses-table" className="w-full min-w-[600px]">
                      <thead className="bg-gray-50 border-b">
                        <tr>
                          <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Date</th>
                          <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Description</th>
                          <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Category</th>
                          <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">Amount (₹)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {expenses.filter(e => e.teamId === 'admin').sort((a, b) => new Date(b.date) - new Date(a.date)).map(expense => (
                          <tr key={expense.id} className="hover:bg-gray-50">
                            <td className="px-4 py-3 text-sm text-gray-600">{expense.date}</td>
                            <td className="px-4 py-3 text-sm text-gray-900">{expense.description}</td>
                            <td className="px-4 py-3 text-sm text-gray-700">{expense.category}</td>
                            <td className="px-4 py-3 text-sm text-right text-red-700 font-semibold">₹{parseFloat(expense.amount).toLocaleString()}</td>
                          </tr>
                        ))}
                        {expenses.filter(e => e.teamId === 'admin').length === 0 && (
                          <tr>
                            <td colSpan="4" className="px-4 py-12 text-center text-gray-500">
                              <DollarSign className="w-12 h-12 mx-auto mb-4 opacity-50" />
                              <p>No expenses recorded</p>
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            ) : (
              <>
                {/* Team Expenses Summary */}
                <div className="bg-white rounded-lg shadow-md p-6">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">Expense Summary</h3>
                  <div className="bg-red-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-600">Grand Total Expenses</p>
                    <p className="text-2xl font-bold text-red-700">₹{getTotalTeamExpenses(currentUser.teamId).toLocaleString()}</p>
                  </div>
                </div>

                {/* Expenses by Settlement */}
                <div className="bg-white rounded-lg shadow-md overflow-hidden">
                  <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-orange-50 border-b">
                    <div>
                      <h3 className="text-lg font-semibold text-orange-900">Expenses by Settlement</h3>
                      <p className="text-sm text-orange-700">Expenditure till each settlement request approval</p>
                    </div>
                    <button
                      onClick={() => exportTableToCSV('team-expenses-table', 'team_expenses')}
                      className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
                    >
                      <Download className="w-4 h-4" />
                      <span>Export CSV</span>
                    </button>
                  </div>
                  <div className="overflow-x-auto">
                    <table id="team-expenses-table" className="w-full min-w-[600px]">
                      <thead className="bg-gray-50 border-b">
                        <tr>
                          <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Settlement Date</th>
                          <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Settlement Amount (₹)</th>
                          <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Status</th>
                          <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">Expenses Till Date (₹)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {moneySettlements
                          .filter(s => s.teamId === currentUser.teamId)
                          .sort((a, b) => new Date(b.date) - new Date(a.date))
                          .map(settlement => {
                            const expensesTillDate = getTeamExpensesTillSettlement(currentUser.teamId, settlement.date)
                              .reduce((sum, e) => sum + (parseFloat(e.amount) || 0), 0);
                            return (
                              <tr key={settlement.id} className="hover:bg-gray-50">
                                <td className="px-4 py-3 text-sm text-gray-600">{settlement.date}</td>
                                <td className="px-4 py-3 text-sm text-green-700 font-semibold">₹{parseFloat(settlement.amount).toLocaleString()}</td>
                                <td className="px-4 py-3 text-center">
                                  <span className={`px-3 py-1 text-xs rounded-full ${
                                    settlement.status === 'approved' ? 'bg-green-100 text-green-700' : 
                                    settlement.status === 'declined' ? 'bg-red-100 text-red-700' : 
                                    'bg-yellow-100 text-yellow-700'
                                  }`}>
                                    {settlement.status}
                                  </span>
                                </td>
                                <td className="px-4 py-3 text-sm text-right text-red-700 font-semibold">₹{expensesTillDate.toLocaleString()}</td>
                              </tr>
                            );
                          })}
                        {moneySettlements.filter(s => s.teamId === currentUser.teamId).length === 0 && (
                          <tr>
                            <td colSpan="4" className="px-4 py-12 text-center text-gray-500">
                              <DollarSign className="w-12 h-12 mx-auto mb-4 opacity-50" />
                              <p>No settlements found</p>
                            </td>
                          </tr>
                        )}
                      </tbody>
                      <tfoot className="bg-gray-50">
                        <tr>
                          <td colSpan="3" className="px-4 py-3 text-sm font-semibold text-gray-700 text-right">Grand Total Expenses:</td>
                          <td className="px-4 py-3 text-sm text-right font-bold text-red-700">₹{getTotalTeamExpenses(currentUser.teamId).toLocaleString()}</td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>

                {/* All Team Expenses */}
                <div className="bg-white rounded-lg shadow-md overflow-hidden">
                  <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-red-50 border-b">
                    <div>
                      <h3 className="text-lg font-semibold text-red-900">All Expenses</h3>
                      <p className="text-sm text-red-700">Complete history of all expenses</p>
                    </div>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[600px]">
                      <thead className="bg-gray-50 border-b">
                        <tr>
                          <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Date</th>
                          <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Description</th>
                          <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Category</th>
                          <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">Amount (₹)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {expenses.filter(e => e.teamId === currentUser.teamId).sort((a, b) => new Date(b.date) - new Date(a.date)).map(expense => (
                          <tr key={expense.id} className="hover:bg-gray-50">
                            <td className="px-4 py-3 text-sm text-gray-600">{expense.date}</td>
                            <td className="px-4 py-3 text-sm text-gray-900">{expense.description}</td>
                            <td className="px-4 py-3 text-sm text-gray-700">{expense.category}</td>
                            <td className="px-4 py-3 text-sm text-right text-red-700 font-semibold">₹{parseFloat(expense.amount).toLocaleString()}</td>
                          </tr>
                        ))}
                        {expenses.filter(e => e.teamId === currentUser.teamId).length === 0 && (
                          <tr>
                            <td colSpan="4" className="px-4 py-12 text-center text-gray-500">
                              <DollarSign className="w-12 h-12 mx-auto mb-4 opacity-50" />
                              <p>No expenses recorded</p>
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* Notifications View */}
        {/* Scores View */}
        {activeView === 'scores' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-800">Scores</h2>
            </div>

            {/* Admin Score Generator */}
            {currentUser.role === 'admin' && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Generate Score Sheet</h3>
                <div className="flex flex-col md:flex-row gap-4 items-end">
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Generation Date *</label>
                    <input
                      type="date"
                      value={scoreGenerationDate}
                      max={new Date().toISOString().split('T')[0]}
                      onChange={(e) => setScoreGenerationDate(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                      required
                    />
                  </div>
                  <button
                    onClick={generateScoreSheet}
                    disabled={isGeneratingScores}
                    className="px-6 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                  >
                    {isGeneratingScores ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        <span>Generating...</span>
                      </>
                    ) : (
                      <>
                        <Trophy className="w-4 h-4" />
                        <span>Generate Scores</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* Score Sheets List */}
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="p-4 bg-orange-50 border-b">
                <h3 className="text-lg font-semibold text-orange-900">Score Sheets</h3>
                <p className="text-sm text-orange-700">All generated score sheets</p>
              </div>
              <div className="divide-y">
                {scoreSheets.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <Trophy className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No score sheets generated yet</p>
                    {currentUser.role === 'admin' && (
                      <p className="text-sm mt-2">Generate a score sheet to get started</p>
                    )}
                  </div>
                ) : (
                  scoreSheets.map((scoreSheet) => {
                    const isExpanded = expandedScoreSheets.has(scoreSheet.id);
                    const generatedDate = scoreSheet.generatedDate?.toDate 
                      ? scoreSheet.generatedDate.toDate() 
                      : new Date(scoreSheet.generatedDate);
                    const createdAt = scoreSheet.createdAt?.toDate 
                      ? scoreSheet.createdAt.toDate() 
                      : (scoreSheet.createdAt ? new Date(scoreSheet.createdAt) : new Date());

                    return (
                      <div key={scoreSheet.id} className="border-b last:border-b-0">
                        {/* Collapsed View */}
                        <div 
                          className="p-4 hover:bg-gray-50 cursor-pointer flex items-center justify-between"
                          onClick={() => toggleScoreSheet(scoreSheet.id)}
                        >
                          <div className="flex-1">
                            <div className="flex items-center space-x-3">
                              <Trophy className="w-5 h-5 text-orange-600" />
                              <div>
                                <p className="font-semibold text-gray-900">
                                  Score Sheet - {generatedDate.toLocaleDateString()}
                                </p>
                                <p className="text-sm text-gray-600">
                                  Created: {createdAt.toLocaleString()}
                                </p>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center space-x-4">
                            {currentUser.role === 'admin' && (
                              <>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    editScoreSheet(scoreSheet.id);
                                  }}
                                  className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors flex items-center space-x-1"
                                  title="Edit Score Sheet"
                                >
                                  <Edit2 className="w-4 h-4" />
                                  <span>Edit</span>
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setShowDeleteConfirm(scoreSheet.id);
                                  }}
                                  className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700 transition-colors flex items-center space-x-1"
                                  title="Delete Score Sheet"
                                >
                                  <Trash2 className="w-4 h-4" />
                                  <span>Delete</span>
                                </button>
                              </>
                            )}
                            {isExpanded ? (
                              <ChevronUp className="w-5 h-5 text-gray-500" />
                            ) : (
                              <ChevronDown className="w-5 h-5 text-gray-500" />
                            )}
                          </div>
                        </div>

                        {/* Expanded View */}
                        {isExpanded && (
                          <div className="p-4 bg-gray-50 border-t">
                            <div className="overflow-x-auto">
                              <table className="w-full min-w-[600px]">
                                <thead className="bg-gray-100 border-b">
                                  <tr>
                                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Team Name</th>
                                    <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">Score</th>
                                    <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">Aggregate Score</th>
                                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Date Generated</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y">
                                  {scoreSheet.scores && scoreSheet.scores.length > 0 ? (
                                    scoreSheet.scores.map((teamScore, idx) => (
                                      <tr key={idx} className="hover:bg-white">
                                        <td className="px-4 py-3 text-sm font-medium text-gray-900">{teamScore.teamName}</td>
                                        <td className="px-4 py-3 text-sm text-right font-semibold text-blue-700">
                                          {teamScore.score.toFixed(2)}
                                        </td>
                                        <td className="px-4 py-3 text-sm text-right font-semibold text-green-700">
                                          {teamScore.aggregateScore.toFixed(2)}
                                        </td>
                                        <td className="px-4 py-3 text-sm text-gray-600">
                                          {generatedDate.toLocaleDateString()}
                                        </td>
                                      </tr>
                                    ))
                                  ) : (
                                    <tr>
                                      <td colSpan="4" className="px-4 py-3 text-sm text-gray-500 text-center">
                                        No scores available
                                      </td>
                                    </tr>
                                  )}
                                </tbody>
                                {scoreSheet.scores && scoreSheet.scores.length > 0 && (
                                  <tfoot className="bg-gray-100 border-t-2">
                                    <tr>
                                      <td className="px-4 py-3 text-sm font-bold text-gray-900">Total Aggregate Score</td>
                                      <td colSpan="2" className="px-4 py-3 text-sm text-right font-bold text-green-700">
                                        {scoreSheet.totalAggregateScore ? scoreSheet.totalAggregateScore.toFixed(2) : 
                                          (scoreSheet.scores.reduce((sum, ts) => sum + ts.aggregateScore, 0).toFixed(2))}
                                      </td>
                                      <td></td>
                                    </tr>
                                  </tfoot>
                                )}
                              </table>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Delete Confirmation Modal */}
            {showDeleteConfirm && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
                  <div className="flex items-center space-x-3 mb-4">
                    <AlertCircle className="w-6 h-6 text-red-600" />
                    <h3 className="text-lg font-semibold text-gray-900">Confirm Deletion</h3>
                  </div>
                  <p className="text-gray-700 mb-6">
                    Are you sure you want to delete this score sheet? This action cannot be undone.
                  </p>
                  <div className="flex justify-end space-x-3">
                    <button
                      onClick={() => setShowDeleteConfirm(null)}
                      className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => {
                        deleteScoreSheet(showDeleteConfirm);
                      }}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {activeView === 'notifications' && currentUser.role === 'admin' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-800">Notifications</h2>

            <div className="space-y-3">
              {notifications.map(notif => (
                <div key={notif.id} className="bg-white rounded-lg shadow-md p-4 flex items-start space-x-3">
                  <AlertCircle className="w-5 h-5 text-orange-600 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-gray-800">{notif.message}</p>
                    <p className="text-sm text-gray-500 mt-1">
                      {new Date(notif.date).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
              
              {notifications.length === 0 && (
                <div className="bg-white rounded-lg shadow-md p-12 text-center text-gray-500">
                  <Bell className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No new notifications</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Inventory View */}
        {activeView === 'inventory' && (
          <div className="space-y-6">
            {currentUser.role === 'admin' ? (
              <>
                {/* Inventory Summary Table */}
                <div className="bg-white rounded-lg shadow-md overflow-hidden">
                  <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setIsInventoryIssuedSummaryCollapsed(!isInventoryIssuedSummaryCollapsed)}
                        className="flex items-center justify-center w-8 h-8 hover:bg-gray-100 rounded transition-colors"
                      >
                        {isInventoryIssuedSummaryCollapsed ? (
                          <ChevronDown className="w-5 h-5 text-gray-700" />
                        ) : (
                          <ChevronUp className="w-5 h-5 text-gray-700" />
                        )}
                      </button>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-800">Inventory Issued Summary</h3>
                        <p className="text-sm text-gray-500">Total inventory items issued to each team</p>
                      </div>
                    </div>
                  </div>
                  {!isInventoryIssuedSummaryCollapsed && (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Team</th>
                          <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Gita Telugu</th>
                          <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Booklet Telugu</th>
                          <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Gita English</th>
                          <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Booklet English</th>
                          <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Calendar</th>
                          <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Chikki</th>
                          <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Pamphlets</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {teams.map(team => {
                          const issueHistory = team.issueHistory || [];
                          const totals = {
                            gitaTelugu: 0,
                            bookletTelugu: 0,
                            gitaEnglish: 0,
                            bookletEnglish: 0,
                            calendar: 0,
                            chikki: 0,
                            pamphlets: 0
                          };
                          
                          issueHistory.forEach(issue => {
                            ISSUE_ITEM_FIELDS.forEach(({ key }) => {
                              totals[key] += parseInt(issue[key]) || 0;
                            });
                          });
                          
                          return (
                            <tr key={team.id} className="hover:bg-gray-50">
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{team.name}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-700">{totals.gitaTelugu}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-700">{totals.bookletTelugu}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-700">{totals.gitaEnglish}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-700">{totals.bookletEnglish}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-700">{totals.calendar}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-700">{totals.chikki}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-700">{totals.pamphlets}</td>
                            </tr>
                          );
                        })}
                        {/* Total Row */}
                        <tr className="bg-orange-50 font-semibold">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">Total</td>
                          {ISSUE_ITEM_FIELDS.map(({ key }) => {
                            const total = teams.reduce((sum, team) => {
                              const issueHistory = team.issueHistory || [];
                              return sum + issueHistory.reduce((issueSum, issue) => issueSum + (parseInt(issue[key]) || 0), 0);
                            }, 0);
                            return (
                              <td key={key} className="px-6 py-4 whitespace-nowrap text-sm text-center text-orange-900">{total}</td>
                            );
                          })}
                        </tr>
                      </tbody>
                    </table>
                  </div>
                  )}
                </div>

                <div className="bg-white rounded-lg shadow-md overflow-hidden">
                  <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setIsInventoryManagementCollapsed(!isInventoryManagementCollapsed)}
                          className="flex items-center justify-center w-8 h-8 hover:bg-gray-100 rounded transition-colors"
                        >
                          {isInventoryManagementCollapsed ? (
                            <ChevronDown className="w-5 h-5 text-gray-700" />
                          ) : (
                            <ChevronUp className="w-5 h-5 text-gray-700" />
                          )}
                        </button>
                        <h2 className="text-2xl font-bold text-gray-800">Inventory Management</h2>
                      </div>
                      {!isInventoryManagementCollapsed && (
                      <div className="flex items-center space-x-4">
                        {/* Pricing Configuration */}
                        <div className="flex items-center space-x-2">
                          <label className="text-sm font-medium text-gray-700">Price per Set:</label>
                          <input
                            type="number"
                            value={perSetPrice}
                            onChange={(e) => ENABLE_INLINE_EDIT && updatePerSetPrice(parseInt(e.target.value) || 200)}
                            disabled={!ENABLE_INLINE_EDIT}
                            className="w-24 px-3 py-1 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                          />
                        </div>
                        {/* Issue Inventory Button */}
                        <button
                          onClick={() => {
                            setModalType('issueInventory');
                            setIssueInventoryForm({
                              teamId: '',
                              gitaTelugu: 0, gitaEnglish: 0,
                              bookletTelugu: 0, bookletEnglish: 0,
                              calendar: 0, chikki: 0, pamphlets: 0,
                              issuedDate: new Date().toISOString().split('T')[0],
                              contactPerson: '',
                              contactPhone: ''
                            });
                            setShowModal(true);
                          }}
                          className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
                        >
                          <Plus className="w-4 h-4" />
                          <span>Issue Inventory</span>
                        </button>
                      </div>
                      )}
                    </div>
                  </div>
                  {!isInventoryManagementCollapsed && (
                  <div className="p-6 space-y-6">
                    {/* Team Selector for Admin */}
                    <div className="bg-white rounded-lg shadow-md p-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">Select Team</label>
                      <select
                        value={selectedTeam || ''}
                        onChange={(e) => setSelectedTeam(e.target.value || null)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                      >
                        <option value="">All Teams</option>
                        {teams.map(team => (
                          <option key={team.id} value={team.id}>{team.name}</option>
                        ))}
                      </select>
                    </div>

                    {/* Inventory Cards for Selected Team(s) */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {(selectedTeam ? [teams.find(t => t.id === selectedTeam)] : teams).filter(Boolean).map(team => {
                    if (!team.inventory) return null;
                    return (
                      <div key={team.id} className="bg-white rounded-lg shadow-md p-6">
                        <div className="flex items-start justify-between mb-4">
                          <h3 className="text-lg font-semibold text-gray-800">{team.name}</h3>
                          <Package className="w-8 h-8 text-orange-600" />
                        </div>
                        
                        <div className="space-y-3">
                          <div className="border-b pb-3">
                            <h4 className="text-sm font-semibold text-gray-700 mb-2">Telugu Sets</h4>
                            <div className="grid grid-cols-2 gap-2 mt-4">
                              <div>
                                <label className="block text-xs text-gray-600 mb-1">Gita Telugu</label>
                                <input
                                  type="number"
                                  value={team.inventory.gitaTelugu || 0}
                                  onChange={(e) => {
                                    const updatedInventory = {
                                      ...team.inventory,
                                      gitaTelugu: parseInt(e.target.value) || 0
                                    };
                                    updateTeamInventory(team.id, updatedInventory);
                                  }}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 text-sm"
                                />
                              </div>
                              <div>
                                <label className="block text-xs text-gray-600 mb-1">Booklet Telugu</label>
                                <input
                                  type="number"
                                  value={team.inventory.bookletTelugu || 0}
                                  onChange={(e) => {
                                    const updatedInventory = {
                                      ...team.inventory,
                                      bookletTelugu: parseInt(e.target.value) || 0
                                    };
                                    updateTeamInventory(team.id, updatedInventory);
                                  }}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 text-sm"
                                />
                              </div>
                            </div>
                          </div>
                          
                          <div className="border-b pb-3">
                            <h4 className="text-sm font-semibold text-gray-700 mb-2">English Sets</h4>
                            <div className="grid grid-cols-2 gap-2 mt-4">
                              <div>
                                <label className="block text-xs text-gray-600 mb-1">Gita English</label>
                                <input
                                  type="number"
                                  value={team.inventory.gitaEnglish || 0}
                                  onChange={(e) => {
                                    const updatedInventory = {
                                      ...team.inventory,
                                      gitaEnglish: parseInt(e.target.value) || 0
                                    };
                                    updateTeamInventory(team.id, updatedInventory);
                                  }}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 text-sm"
                                />
                              </div>
                              <div>
                                <label className="block text-xs text-gray-600 mb-1">Booklet English</label>
                                <input
                                  type="number"
                                  value={team.inventory.bookletEnglish || 0}
                                  onChange={(e) => {
                                    const updatedInventory = {
                                      ...team.inventory,
                                      bookletEnglish: parseInt(e.target.value) || 0
                                    };
                                    updateTeamInventory(team.id, updatedInventory);
                                  }}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 text-sm"
                                />
                              </div>
                            </div>
                          </div>
                          
                          <div>
                            <h4 className="text-sm font-semibold text-gray-700 mb-2">Accessories</h4>
                            <div className="grid grid-cols-2 gap-2 mt-4">
                              <div>
                                <label className="block text-xs text-gray-600 mb-1">Calendar</label>
                                <input
                                  type="number"
                                  value={team.inventory.calendar || 0}
                                  onChange={(e) => {
                                    const updatedInventory = {
                                      ...team.inventory,
                                      calendar: parseInt(e.target.value) || 0
                                    };
                                    updateTeamInventory(team.id, updatedInventory);
                                  }}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 text-sm"
                                />
                              </div>
                              <div>
                                <label className="block text-xs text-gray-600 mb-1">Chikki</label>
                                <input
                                  type="number"
                                  value={team.inventory.chikki || 0}
                                  onChange={(e) => {
                                    const updatedInventory = {
                                      ...team.inventory,
                                      chikki: parseInt(e.target.value) || 0
                                    };
                                    updateTeamInventory(team.id, updatedInventory);
                                  }}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 text-sm"
                                />
                              </div>
                              <div>
                                <label className="block text-xs text-gray-600 mb-1">Pamphlets</label>
                                <input
                                  type="number"
                                  value={team.inventory.pamphlets || 0}
                                  onChange={(e) => {
                                    const updatedInventory = {
                                      ...team.inventory,
                                      pamphlets: parseInt(e.target.value) || 0
                                    };
                                    updateTeamInventory(team.id, updatedInventory);
                                  }}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 text-sm"
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        <div className="mt-6 pt-4 border-t border-gray-100">
                          <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                            <div>
                              <h4 className="text-sm font-semibold text-gray-700">Recent Issuance History</h4>
                              <span className="text-xs text-gray-500">Latest 10 entries</span>
                            </div>
                            <button
                              onClick={() => exportTableToCSV(`team-${team.id}-history-table`, `${team.name || 'team'}_issuance_history`)}
                              className="flex items-center space-x-1 text-xs bg-green-600 text-white px-3 py-1.5 rounded-lg hover:bg-green-700 transition-colors"
                            >
                              <Download className="w-3 h-3" />
                              <span>Export CSV</span>
                            </button>
                          </div>
                          {(() => {
                            const historyEntries = formatIssueHistoryEntries(team.issueHistory || []).slice(0, 10);
                            
                            if (historyEntries.length === 0) {
                              return (
                                <div className="text-sm text-gray-500 bg-gray-50 border border-dashed border-gray-200 rounded-lg p-4 text-center">
                                  No issuance history recorded for this team yet.
                                </div>
                              );
                            }
                            
                            return (
                              <div className="overflow-x-auto border border-gray-100 rounded-lg">
                                <table id={`team-${team.id}-history-table`} className="w-full text-sm min-w-[600px]">
                                  <thead className="bg-gray-50 text-left text-gray-600">
                                    <tr>
                                      <th className="px-3 py-2 font-semibold">Date</th>
                                      {ISSUE_ITEM_FIELDS.map(({ key, label }) => (
                                        <th key={`${team.id}-head-${key}`} className="px-3 py-2 font-semibold text-right">{label}</th>
                                      ))}
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y">
                                    {historyEntries.map((entry, index) => (
                                      <tr key={`${team.id}-history-${index}`}>
                                        <td className="px-3 py-2 text-gray-700 whitespace-nowrap">{entry.dateLabel}</td>
                                        {ISSUE_ITEM_FIELDS.map(({ key }) => (
                                          <td key={`${team.id}-history-${index}-${key}`} className="px-3 py-2 text-right text-gray-800">{entry[key]}</td>
                                        ))}
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            );
                          })()}
                        </div>
                      </div>
                    );
                  })}
                    </div>
                  </div>
                  )}
                </div>

                {/* Inventory Issuance History Table */}
                <div className="bg-white rounded-lg shadow-md overflow-hidden">
                  <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-blue-50 border-b">
                    <div className="flex items-center gap-2 flex-1">
                      <button
                        onClick={() => setIsInventoryTabIssuanceHistoryCollapsed(!isInventoryTabIssuanceHistoryCollapsed)}
                        className="flex items-center justify-center w-8 h-8 hover:bg-blue-100 rounded transition-colors"
                      >
                        {isInventoryTabIssuanceHistoryCollapsed ? (
                          <ChevronDown className="w-5 h-5 text-blue-900" />
                        ) : (
                          <ChevronUp className="w-5 h-5 text-blue-900" />
                        )}
                      </button>
                      <div>
                        <h3 className="text-lg font-semibold text-blue-900">Inventory Issuance History</h3>
                        <p className="text-sm text-blue-700">Complete history of all inventory items issued to teams</p>
                      </div>
                    </div>
                    {!isInventoryTabIssuanceHistoryCollapsed && (
                    <button
                      onClick={() => exportTableToCSV('inventory-issuance-table', 'inventory_issuance')}
                      className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
                    >
                      <Download className="w-4 h-4" />
                      <span>Export CSV</span>
                    </button>
                    )}
                  </div>
                  {!isInventoryTabIssuanceHistoryCollapsed && (
                  <div className="overflow-x-auto">
                    <table id="inventory-issuance-table" className="w-full min-w-[700px]">
                      <thead className="bg-gray-50 border-b">
                        <tr>
                          <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Date Issued</th>
                          <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Team</th>
                          <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">Gita Telugu</th>
                          <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">Booklet Telugu</th>
                          <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">Gita English</th>
                          <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">Booklet English</th>
                          <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">Calendar</th>
                          <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">Chikki</th>
                          <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">Pamphlets</th>
                          <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">Total Items</th>
                          <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Contact Person</th>
                          <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Phone Number</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {(() => {
                          // Get all issuance history from all teams
                          const allIssues = teams.flatMap(team => {
                            const issueHistory = team.issueHistory || [];
                            return issueHistory.map(issue => ({
                              ...issue,
                              teamName: team.name,
                              teamId: team.id
                            }));
                          });

                          // Sort by date (newest first)
                          allIssues.sort((a, b) => new Date(b.issuedDate) - new Date(a.issuedDate));

                          if (allIssues.length === 0) {
                            return (
                              <tr>
                                <td colSpan="12" className="px-4 py-12 text-center text-gray-500">
                                  <Package className="w-12 h-12 mx-auto mb-4 opacity-50" />
                                  <p>No inventory issuance records found</p>
                                </td>
                              </tr>
                            );
                          }

                          return allIssues.map((issue, idx) => {
                            const totalItems = (parseInt(issue.gitaTelugu) || 0) + 
                                             (parseInt(issue.bookletTelugu) || 0) +
                                             (parseInt(issue.gitaEnglish) || 0) +
                                             (parseInt(issue.bookletEnglish) || 0) +
                                             (parseInt(issue.calendar) || 0) +
                                             (parseInt(issue.chikki) || 0) +
                                             (parseInt(issue.pamphlets) || 0);
                            
                            return (
                              <tr key={idx} className="hover:bg-gray-50">
                                <td className="px-4 py-3 text-sm text-gray-600">{new Date(issue.issuedDate).toLocaleDateString()}</td>
                                <td className="px-4 py-3 text-sm font-medium text-gray-900">{issue.teamName}</td>
                                <td className="px-4 py-3 text-sm text-right text-gray-700">{issue.gitaTelugu || 0}</td>
                                <td className="px-4 py-3 text-sm text-right text-gray-700">{issue.bookletTelugu || 0}</td>
                                <td className="px-4 py-3 text-sm text-right text-gray-700">{issue.gitaEnglish || 0}</td>
                                <td className="px-4 py-3 text-sm text-right text-gray-700">{issue.bookletEnglish || 0}</td>
                                <td className="px-4 py-3 text-sm text-right text-gray-700">{issue.calendar || 0}</td>
                                <td className="px-4 py-3 text-sm text-right text-gray-700">{issue.chikki || 0}</td>
                                <td className="px-4 py-3 text-sm text-right text-gray-700">{issue.pamphlets || 0}</td>
                                <td className="px-4 py-3 text-sm text-right font-semibold text-green-700">{totalItems}</td>
                                <td className="px-4 py-3 text-sm text-gray-700">{issue.contactPerson || 'N/A'}</td>
                                <td className="px-4 py-3 text-sm text-gray-700">{issue.contactPhone || 'N/A'}</td>
                              </tr>
                            );
                          });
                        })()}
                      </tbody>
                    </table>
                  </div>
                  )}
                </div>
              </>
            ) : (
              <>
                {/* Team User Inventory View (Read-Only) */}
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold text-gray-800">My Inventory</h2>
                  <div className="flex items-center space-x-2 text-orange-600">
                    <Package className="w-6 h-6" />
                    <span className="text-sm font-medium">Read-Only</span>
                  </div>
                </div>
                
                {(() => {
                  const team = teams.find(t => t.id === currentUser.teamId);
                  if (!team || !team.inventory) {
                    return (
                      <div className="bg-white rounded-lg shadow-md p-12 text-center text-gray-500">
                        <Package className="w-12 h-12 mx-auto mb-4 opacity-50" />
                        <p>No inventory data available</p>
                      </div>
                    );
                  }
                  
                  // Calculate minimum set counts (bottleneck items)
                  const maxEnglishSets = Math.min(
                    team.inventory.gitaEnglish || 0,
                    team.inventory.bookletEnglish || 0,
                    team.inventory.calendar || 0,
                    team.inventory.chikki || 0
                  );
                  const maxTeluguSets = Math.min(
                    team.inventory.gitaTelugu || 0,
                    team.inventory.bookletTelugu || 0,
                    team.inventory.calendar || 0,
                    team.inventory.chikki || 0
                  );
                  
                  return (
                    <div className="space-y-6">
                      {/* Summary Cards */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg p-6 border border-orange-200">
                          <div className="flex items-center space-x-3 mb-3">
                            <BookOpen className="w-8 h-8 text-orange-600" />
                            <h3 className="text-xl font-bold text-gray-800">Available Sets</h3>
                          </div>
                          <div className="grid grid-cols-2 gap-4 mt-4">
                            <div>
                              <div className="text-sm text-gray-600 mb-1">Telugu Sets</div>
                              <div className="text-3xl font-bold text-orange-700">{maxTeluguSets}</div>
                            </div>
                            <div>
                              <div className="text-sm text-gray-600 mb-1">English Sets</div>
                              <div className="text-3xl font-bold text-orange-700">{maxEnglishSets}</div>
                            </div>
                          </div>
                        </div>
                        
                        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-6 border border-blue-200">
                          <div className="flex items-center space-x-3 mb-3">
                            <Package className="w-8 h-8 text-blue-600" />
                            <h3 className="text-xl font-bold text-gray-800">Quick Stats</h3>
                          </div>
                          <div className="grid grid-cols-2 gap-4 mt-4">
                            <div>
                              <div className="text-sm text-gray-600 mb-1">Total Items</div>
                              <div className="text-3xl font-bold text-blue-700">
                                {(team.inventory.gitaTelugu || 0) + 
                                 (team.inventory.gitaEnglish || 0) + 
                                 (team.inventory.bookletTelugu || 0) + 
                                 (team.inventory.bookletEnglish || 0) + 
                                 (team.inventory.calendar || 0) + 
                                 (team.inventory.chikki || 0) + 
                                 (team.inventory.pamphlets || 0)}
                              </div>
                            </div>
                            <div>
                              <div className="text-sm text-gray-600 mb-1">Total Accessories</div>
                              <div className="text-3xl font-bold text-blue-700">
                                {(team.inventory.calendar || 0) + (team.inventory.chikki || 0) + (team.inventory.pamphlets || 0)}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      {/* Detailed Inventory */}
                      <div className="bg-white rounded-lg shadow-md p-6">
                        <h3 className="text-lg font-semibold text-gray-800 mb-4">Detailed Inventory</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                          <div className="border-2 border-orange-200 rounded-lg p-5 bg-orange-50">
                            <h4 className="text-md font-bold text-orange-800 mb-3 flex items-center space-x-2">
                              <BookOpen className="w-5 h-5 mr-2" />
                              <span>Telugu Sets</span>
                            </h4>
                            <div className="space-y-3">
                              <div className="flex justify-between items-center">
                                <span className="text-sm font-medium text-gray-700">Gita Telugu:</span>
                                <span className="font-bold text-lg text-orange-600">{team.inventory.gitaTelugu || 0}</span>
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="text-sm font-medium text-gray-700">Booklet Telugu:</span>
                                <span className="font-bold text-lg text-orange-600">{team.inventory.bookletTelugu || 0}</span>
                              </div>
                              <div className="pt-3 border-t border-orange-300">
                                <div className="flex justify-between items-center">
                                  <span className="text-sm font-bold text-gray-800">Complete Sets:</span>
                                  <span className="font-bold text-xl text-orange-700">{maxTeluguSets}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                          
                          <div className="border-2 border-blue-200 rounded-lg p-5 bg-blue-50">
                            <h4 className="text-md font-bold text-blue-800 mb-3 flex items-center space-x-2">
                              <BookOpen className="w-5 h-5 mr-2" />
                              <span>English Sets</span>
                            </h4>
                            <div className="space-y-3">
                              <div className="flex justify-between items-center">
                                <span className="text-sm font-medium text-gray-700">Gita English:</span>
                                <span className="font-bold text-lg text-blue-600">{team.inventory.gitaEnglish || 0}</span>
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="text-sm font-medium text-gray-700">Booklet English:</span>
                                <span className="font-bold text-lg text-blue-600">{team.inventory.bookletEnglish || 0}</span>
                              </div>
                              <div className="pt-3 border-t border-blue-300">
                                <div className="flex justify-between items-center">
                                  <span className="text-sm font-bold text-gray-800">Complete Sets:</span>
                                  <span className="font-bold text-xl text-blue-700">{maxEnglishSets}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                          
                          <div className="border-2 border-green-200 rounded-lg p-5 bg-green-50">
                            <h4 className="text-md font-bold text-green-800 mb-3 flex items-center space-x-2">
                              <Package className="w-5 h-5 mr-2" />
                              <span>Accessories</span>
                            </h4>
                            <div className="space-y-3">
                              <div className="flex justify-between items-center">
                                <span className="text-sm font-medium text-gray-700">Calendar:</span>
                                <span className="font-bold text-lg text-green-600">{team.inventory.calendar || 0}</span>
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="text-sm font-medium text-gray-700">Chikki:</span>
                                <span className="font-bold text-lg text-green-600">{team.inventory.chikki || 0}</span>
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="text-sm font-medium text-gray-700">Pamphlets:</span>
                                <span className="font-bold text-lg text-green-600">{team.inventory.pamphlets || 0}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      {/* Issuance History */}
                      <div className="bg-white rounded-lg shadow-md p-6">
                        <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
                          <div>
                            <h3 className="text-lg font-semibold text-gray-800">Inventory Issuance History</h3>
                            <span className="text-xs text-gray-500">Complete history</span>
                          </div>
                          <button
                            onClick={() => exportTableToCSV('team-view-history-table', 'my_team_issuance_history')}
                            className="flex items-center space-x-2 bg-green-600 text-white px-3 py-1.5 rounded-lg hover:bg-green-700 transition-colors text-sm"
                          >
                            <Download className="w-4 h-4" />
                            <span>Export CSV</span>
                          </button>
                        </div>
                        {(() => {
                          const historyEntries = formatIssueHistoryEntries(team.issueHistory || []);
                          
                          if (historyEntries.length === 0) {
                            return (
                              <div className="text-center text-gray-500 bg-gray-50 border border-dashed border-gray-200 rounded-lg p-6">
                                No issuance history found for your team yet.
                              </div>
                            );
                          }
                          
                          return (
                            <div className="max-h-64 overflow-y-auto border border-gray-100 rounded-lg">
                              <table id="team-view-history-table" className="w-full text-sm min-w-[600px]">
                                <thead className="bg-gray-50 text-left text-gray-600">
                                  <tr>
                                    <th className="px-4 py-2 font-semibold">Date</th>
                                    {ISSUE_ITEM_FIELDS.map(({ key, label }) => (
                                      <th key={`team-view-head-${key}`} className="px-4 py-2 font-semibold text-right">{label}</th>
                                    ))}
                                  </tr>
                                </thead>
                                <tbody className="divide-y">
                                  {historyEntries.map((entry, index) => (
                                    <tr key={`team-view-history-${index}`}>
                                      <td className="px-4 py-2 text-gray-700 whitespace-nowrap">{entry.dateLabel}</td>
                                      {ISSUE_ITEM_FIELDS.map(({ key }) => (
                                        <td key={`team-view-history-${index}-${key}`} className="px-4 py-2 text-right text-gray-900 font-semibold">{entry[key]}</td>
                                      ))}
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          );
                        })()}
                      </div>
                    </div>
                  );
                })()}
              </>
            )}
          </div>
        )}

        {/* Master Inventory View (Admin Only) */}
        {activeView === 'masterInventory' && currentUser.role === 'admin' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-800">Master Inventory</h2>
              <button
                onClick={() => {
                  setModalType('addInventory');
                  setAddInventoryForm({
                    gitaTelugu: 0,
                    gitaEnglish: 0,
                    bookletTelugu: 0,
                    bookletEnglish: 0,
                    calendar: 0,
                    chikki: 0,
                    date: new Date().toISOString().split('T')[0],
                    notes: ''
                  });
                  setShowModal(true);
                }}
                className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>Add Inventory</span>
              </button>
            </div>

            {/* Current Stock Display */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Current Stock</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="border-2 border-orange-200 rounded-lg p-5 bg-orange-50">
                  <h4 className="text-md font-bold text-orange-800 mb-3 flex items-center space-x-2">
                    <BookOpen className="w-5 h-5 mr-2" />
                    <span>Telugu Sets</span>
                  </h4>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-gray-700">Gita Telugu:</span>
                      <span className="font-bold text-lg text-orange-600">{masterInventory.gitaTelugu || 0}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-gray-700">Booklet Telugu:</span>
                      <span className="font-bold text-lg text-orange-600">{masterInventory.bookletTelugu || 0}</span>
                    </div>
                    <div className="pt-3 border-t border-orange-300">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-bold text-gray-800">Complete Sets:</span>
                        <span className="font-bold text-xl text-orange-700">
                          {Math.min(
                            masterInventory.gitaTelugu || 0,
                            masterInventory.bookletTelugu || 0,
                            masterInventory.calendar || 0,
                            masterInventory.chikki || 0
                          )}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="border-2 border-blue-200 rounded-lg p-5 bg-blue-50">
                  <h4 className="text-md font-bold text-blue-800 mb-3 flex items-center space-x-2">
                    <BookOpen className="w-5 h-5 mr-2" />
                    <span>English Sets</span>
                  </h4>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-gray-700">Gita English:</span>
                      <span className="font-bold text-lg text-blue-600">{masterInventory.gitaEnglish || 0}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-gray-700">Booklet English:</span>
                      <span className="font-bold text-lg text-blue-600">{masterInventory.bookletEnglish || 0}</span>
                    </div>
                    <div className="pt-3 border-t border-blue-300">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-bold text-gray-800">Complete Sets:</span>
                        <span className="font-bold text-xl text-blue-700">
                          {Math.min(
                            masterInventory.gitaEnglish || 0,
                            masterInventory.bookletEnglish || 0,
                            masterInventory.calendar || 0,
                            masterInventory.chikki || 0
                          )}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="border-2 border-green-200 rounded-lg p-5 bg-green-50">
                  <h4 className="text-md font-bold text-green-800 mb-3 flex items-center space-x-2">
                    <Package className="w-5 h-5 mr-2" />
                    <span>Accessories</span>
                  </h4>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-gray-700">Calendar:</span>
                      <span className="font-bold text-lg text-green-600">{masterInventory.calendar || 0}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-gray-700">Chikki:</span>
                      <span className="font-bold text-lg text-green-600">{masterInventory.chikki || 0}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-gray-700">Pamphlets:</span>
                      <span className="font-bold text-lg text-green-600">{masterInventory.pamphlets || 0}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Total Summary */}
              <div className="mt-6 pt-6 border-t border-gray-200">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="text-sm text-gray-600 mb-1">Total Gitas</div>
                    <div className="text-2xl font-bold text-gray-800">
                      {(masterInventory.gitaTelugu || 0) + 
                       (masterInventory.gitaEnglish || 0)}
                    </div>
                  </div>
                  <div className="bg-orange-50 rounded-lg p-4">
                    <div className="text-sm text-gray-600 mb-1">Total Telugu Sets</div>
                    <div className="text-2xl font-bold text-orange-700">
                      {Math.min(
                        masterInventory.gitaTelugu || 0,
                        masterInventory.bookletTelugu || 0,
                        masterInventory.calendar || 0,
                        masterInventory.chikki || 0
                      )}
                    </div>
                  </div>
                  <div className="bg-blue-50 rounded-lg p-4">
                    <div className="text-sm text-gray-600 mb-1">Total English Sets</div>
                    <div className="text-2xl font-bold text-blue-700">
                      {Math.min(
                        masterInventory.gitaEnglish || 0,
                        masterInventory.bookletEnglish || 0,
                        masterInventory.calendar || 0,
                        masterInventory.chikki || 0
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Aggregate Stock Display */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Aggregate Stock</h3>
              <p className="text-sm text-gray-600 mb-4">Total inventory accumulated over time (only additions, not decremented by issues)</p>
              {(() => {
                const aggregateStock = calculateAggregateStock();
                return (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <div className="border-2 border-orange-200 rounded-lg p-5 bg-orange-50">
                      <h4 className="text-md font-bold text-orange-800 mb-3 flex items-center space-x-2">
                        <BookOpen className="w-5 h-5 mr-2" />
                        <span>Telugu Sets</span>
                      </h4>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium text-gray-700">Gita Telugu:</span>
                          <span className="font-bold text-lg text-orange-600">{aggregateStock.gitaTelugu || 0}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium text-gray-700">Booklet Telugu:</span>
                          <span className="font-bold text-lg text-orange-600">{aggregateStock.bookletTelugu || 0}</span>
                        </div>
                        
                      </div>
                    </div>
                    
                    <div className="border-2 border-blue-200 rounded-lg p-5 bg-blue-50">
                      <h4 className="text-md font-bold text-blue-800 mb-3 flex items-center space-x-2">
                        <BookOpen className="w-5 h-5 mr-2" />
                        <span>English Sets</span>
                      </h4>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium text-gray-700">Gita English:</span>
                          <span className="font-bold text-lg text-blue-600">{aggregateStock.gitaEnglish || 0}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium text-gray-700">Booklet English:</span>
                          <span className="font-bold text-lg text-blue-600">{aggregateStock.bookletEnglish || 0}</span>
                        </div>
                        
                      </div>
                    </div>
                    
                    <div className="border-2 border-green-200 rounded-lg p-5 bg-green-50">
                      <h4 className="text-md font-bold text-green-800 mb-3 flex items-center space-x-2">
                        <Package className="w-5 h-5 mr-2" />
                        <span>Accessories</span>
                      </h4>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium text-gray-700">Calendar:</span>
                          <span className="font-bold text-lg text-green-600">{aggregateStock.calendar || 0}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium text-gray-700">Chikki:</span>
                          <span className="font-bold text-lg text-green-600">{aggregateStock.chikki || 0}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium text-gray-700">Pamphlets:</span>
                          <span className="font-bold text-lg text-green-600">{aggregateStock.pamphlets || 0}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })()}

              
            </div>
              
            {/* Inventory History Table */}
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-blue-50 border-b">
                <div>
                  <h3 className="text-lg font-semibold text-blue-900">Inventory History</h3>
                  <p className="text-sm text-blue-700">All inventory additions and issues</p>
                </div>
                <button
                  onClick={() => exportTableToCSV('master-inventory-history-table', 'master_inventory_history')}
                  className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
                >
                  <Download className="w-4 h-4" />
                  <span>Export CSV</span>
                </button>
              </div>
              <div className="overflow-x-auto">
                <table id="master-inventory-history-table" className="w-full min-w-[800px]">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Date</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Type</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Team</th>
                      <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">Gita Telugu</th>
                      <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">Booklet Telugu</th>
                      <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">Gita English</th>
                      <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">Booklet English</th>
                      <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">Calendar</th>
                      <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">Chikki</th>
                      <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">Pamphlets</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Notes</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {masterInventoryHistory.length === 0 ? (
                      <tr>
                        <td colSpan="11" className="px-4 py-12 text-center text-gray-500">
                          <Package className="w-12 h-12 mx-auto mb-4 opacity-50" />
                          <p>No inventory history found</p>
                        </td>
                      </tr>
                    ) : (
                      masterInventoryHistory.map((item, idx) => {
                        const totalItems = (parseInt(item.gitaTelugu) || 0) + 
                                         (parseInt(item.bookletTelugu) || 0) +
                                         (parseInt(item.gitaEnglish) || 0) +
                                         (parseInt(item.bookletEnglish) || 0) +
                                         (parseInt(item.calendar) || 0) +
                                         (parseInt(item.chikki) || 0) +
                                         (parseInt(item.pamphlets) || 0);
                        const displayDate = item.date || item.issuedDate || item.timestamp || '';
                        
                        return (
                          <tr key={item.id || idx} className="hover:bg-gray-50">
                            <td className="px-4 py-3 text-sm text-gray-600">
                              {displayDate ? new Date(displayDate).toLocaleDateString() : 'N/A'}
                            </td>
                            <td className="px-4 py-3 text-sm">
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                item.type === 'added' 
                                  ? 'bg-green-100 text-green-700' 
                                  : 'bg-orange-100 text-orange-700'
                              }`}>
                                {item.type === 'added' ? 'Added' : 'Issued'}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-sm font-medium text-gray-900">
                              {item.teamName || item.contactPerson || '-'}
                            </td>
                            <td className="px-4 py-3 text-sm text-right text-gray-700">{item.gitaTelugu || 0}</td>
                            <td className="px-4 py-3 text-sm text-right text-gray-700">{item.bookletTelugu || 0}</td>
                            <td className="px-4 py-3 text-sm text-right text-gray-700">{item.gitaEnglish || 0}</td>
                            <td className="px-4 py-3 text-sm text-right text-gray-700">{item.bookletEnglish || 0}</td>
                            <td className="px-4 py-3 text-sm text-right text-gray-700">{item.calendar || 0}</td>
                            <td className="px-4 py-3 text-sm text-right text-gray-700">{item.chikki || 0}</td>
                            <td className="px-4 py-3 text-sm text-right text-gray-700">{item.pamphlets || 0}</td>
                            <td className="px-4 py-3 text-sm text-gray-700">{item.notes || '-'}</td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Quick View Modal for Settlement Details */}
      {quickViewSettlement && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={() => setQuickViewSettlement(null)}>
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 border-b bg-gradient-to-r from-blue-50 to-blue-100">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-blue-900">{quickViewSettlement.teamName}</h3>
                <button
                  onClick={() => setQuickViewSettlement(null)}
                  className="p-1 hover:bg-blue-200 rounded-full transition-colors"
                >
                  <X className="w-5 h-5 text-blue-700" />
                </button>
              </div>
              <p className="text-sm text-blue-700 mt-1">Settlement Details Overview</p>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-600">Total Inventory Issued</span>
                <span className="text-lg font-bold text-gray-900">{quickViewSettlement.totalInventoryIssued}</span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-600">Expected Settlement</span>
                <span className="text-lg font-bold text-purple-700">₹{quickViewSettlement.expectedSettlement.toLocaleString()}</span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-600">Total Money Settled</span>
                <span className="text-lg font-bold text-green-700">₹{quickViewSettlement.totalMoneySettled.toLocaleString()}</span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-600">Total Expenses</span>
                <span className="text-lg font-bold text-red-700">₹{quickViewSettlement.totalExpenses.toLocaleString()}</span>
              </div>
              
              <div className="pt-4 border-t">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-600">Balance</span>
                  <span className={`text-2xl font-bold ${quickViewSettlement.balance >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                    {quickViewSettlement.balance >= 0 ? '+' : ''}₹{quickViewSettlement.balance.toLocaleString()}
                  </span>
                </div>
              </div>
              
              <div className="pt-4">
                <div className="text-xs text-gray-500 text-center">
                  Settlement Rate: {((quickViewSettlement.totalMoneySettled / quickViewSettlement.expectedSettlement) * 100).toFixed(1)}%
                </div>
              </div>
            </div>
            
            <div className="p-4 bg-gray-50 border-t flex justify-end">
              <button
                onClick={() => setQuickViewSettlement(null)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
              <h3 className="text-xl font-semibold text-gray-800">
                {modalType === 'school' && (editingItem ? 'Edit School' : 'Add School')}
                {modalType === 'team' && 'Add Team'}
                {modalType === 'requirement' && 'Raise Requirement'}
                {modalType === 'viewSchool' && 'School Details'}
                {modalType === 'settlement' && 'Submit Money Settlement'}
                {modalType === 'expense' && 'Add Expense'}
                {modalType === 'bankSubmission' && 'Submit to Bank'}
                {modalType === 'issueInventory' && 'Issue Inventory to Team'}
                {modalType === 'addInventory' && 'Add Inventory to Master'}
              </h3>
              <div className="flex items-center gap-2">
                {/* Undo button - only show when editing and there's undo history */}
                {modalType === 'school' && editingItem && undoHistory.length > 0 && (
                  <button
                    onClick={undoLastChange}
                    className="flex items-center space-x-1 px-3 py-1.5 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm"
                    title={`Undo last change (${undoHistory.length} change${undoHistory.length > 1 ? 's' : ''} available)`}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                    </svg>
                    <span>Undo</span>
                    {undoHistory.length > 1 && (
                      <span className="bg-gray-500 px-1.5 py-0.5 rounded text-xs">
                        {undoHistory.length}
                      </span>
                    )}
                  </button>
                )}
                <button
                  onClick={() => {
                    setShowModal(false);
                    setEditingItem(null);
                    // Clear undo history when closing modal
                    setUndoHistory([]);
                    setCanUndo(false);
                  }}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            <div className="p-6">
              {/* School Form */}
              {modalType === 'school' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Area Name *</label>
                      <input
                        type="text"
                        value={schoolForm.areaName}
                        onChange={(e) => setSchoolForm({...schoolForm, areaName: e.target.value})}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                        required
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">School Name *</label>
                      <input
                        type="text"
                        value={schoolForm.schoolName}
                        onChange={(e) => setSchoolForm({...schoolForm, schoolName: e.target.value})}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                        required
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Announcement Date *</label>
                      <input
                        type="date"
                        value={schoolForm.date}
                        onChange={(e) => setSchoolForm({...schoolForm, date: e.target.value})}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                        required
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Activity *</label>
                      <select
                        value={schoolForm.activity || normalizeActivity(schoolForm.announcementStatus) || 'To Be Visited'}
                        onChange={(e) => setSchoolForm({...schoolForm, activity: e.target.value})}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                        required
                      >
                        <option value="To Be Visited">To Be Visited</option>
                        <option value="Visited">Visited</option>
                        <option value="Declined">Declined</option>
                        <option value="Announcement Pending">Announcement Pending</option>
                        <option value="Announced">Announced</option>
                        <option value="To Close">To Close</option>
                        <option value="Settlement Closed">Settlement Closed</option>
                      </select>
                    </div>
                  </div>
                    
                  {/* Only show these fields when editing */}
                  {editingItem && (
                    <>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Telugu Sets Distributed</label>
                          <input
                            type="number"
                            value={schoolForm.teluguSetsDistributed}
                            readOnly
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-600 cursor-not-allowed"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">English Sets Distributed</label>
                          <input
                            type="number"
                            value={schoolForm.englishSetsDistributed}
                            readOnly
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-600 cursor-not-allowed"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Money Collected (₹)</label>
                        <input
                          type="number"
                          value={schoolForm.moneyCollected}
                          readOnly
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-600 cursor-not-allowed"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Telugu Sets Taken Back</label>
                        <input
                          type="number"
                          value={schoolForm.teluguSetsTakenBack}
                          readOnly
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-600 cursor-not-allowed"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">English Sets Taken Back</label>
                        <input
                          type="number"
                          value={schoolForm.englishSetsTakenBack}
                          readOnly
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-600 cursor-not-allowed"
                        />
                      </div>
                    </>
                  )}
                  
                  {/* Only show inventory items when editing - View Only */}
                  {editingItem && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Telugu Sets Issued</label>
                        <input
                          type="number"
                          value={schoolForm.teluguSetsIssued}
                          readOnly
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-600 cursor-not-allowed"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">English Sets Issued</label>
                        <input
                          type="number"
                          value={schoolForm.englishSetsIssued}
                          readOnly
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-600 cursor-not-allowed"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Free Sets Given</label>
                        <input
                          type="number"
                          value={schoolForm.freeSetsGiven}
                          readOnly
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-600 cursor-not-allowed"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Pamphlets</label>
                        <input
                          type="number"
                          value={schoolForm.pamphlets || 0}
                          readOnly
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-600 cursor-not-allowed"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Per Set Price (₹)</label>
                        <input
                          type="number"
                          value={schoolForm.perSetPrice}
                          readOnly
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-600 cursor-not-allowed"
                        />
                      </div>
                    </div>
                  )}

                  {/* Incremental Updates Section - Only shown when editing, appears after inventory items */}
                  {editingItem && (
                    <div className="bg-orange-50 p-4 rounded-lg border-2 border-orange-200">
                      <h4 className="text-lg font-semibold text-orange-800 mb-4 flex items-center">
                        <Plus className="w-5 h-5 mr-2" />
                        Incremental Updates (Add Daily Increments)
                      </h4>
                      
                      <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Update Date</label>
                        <input
                          type="date"
                          value={incrementalUpdate.date}
                          onChange={(e) => setIncrementalUpdate({...incrementalUpdate, date: e.target.value})}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        {/* Money Collected Increment */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Money Collected</label>
                          <input
                            type="number"
                            placeholder="Add amount"
                            value={incrementalUpdate.moneyCollected || ''}
                            onChange={(e) => setIncrementalUpdate({...incrementalUpdate, moneyCollected: e.target.value})}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                          />
                        </div>

                        {/* Telugu Sets Distributed Increment */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Telugu Sets Distributed</label>
                          <input
                            type="number"
                            placeholder="Add telugu sets"
                            value={incrementalUpdate.teluguSetsDistributed || ''}
                            onChange={(e) => setIncrementalUpdate({...incrementalUpdate, teluguSetsDistributed: e.target.value})}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                          />
                        </div>

                        {/* English Sets Distributed Increment */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">English Sets Distributed</label>
                          <input
                            type="number"
                            placeholder="Add english sets"
                            value={incrementalUpdate.englishSetsDistributed || ''}
                            onChange={(e) => setIncrementalUpdate({...incrementalUpdate, englishSetsDistributed: e.target.value})}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                          />
                        </div>

                        {/* Telugu Sets Issued Increment */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Telugu Sets Issued</label>
                          <input
                            type="number"
                            placeholder="Add telugu sets issued"
                            value={incrementalUpdate.teluguSetsIssued || ''}
                            onChange={(e) => setIncrementalUpdate({...incrementalUpdate, teluguSetsIssued: e.target.value})}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                          />
                        </div>

                        {/* English Sets Issued Increment */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">English Sets Issued</label>
                          <input
                            type="number"
                            placeholder="Add english sets issued"
                            value={incrementalUpdate.englishSetsIssued || ''}
                            onChange={(e) => setIncrementalUpdate({...incrementalUpdate, englishSetsIssued: e.target.value})}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                          />
                        </div>

                        {/* Telugu Sets Taken Back Increment */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Telugu Sets Taken Back</label>
                          <input
                            type="number"
                            placeholder="Add telugu returned"
                            value={incrementalUpdate.teluguSetsTakenBack || ''}
                            onChange={(e) => setIncrementalUpdate({...incrementalUpdate, teluguSetsTakenBack: e.target.value})}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                          />
                        </div>

                        {/* English Sets Taken Back Increment */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">English Sets Taken Back</label>
                          <input
                            type="number"
                            placeholder="Add english returned"
                            value={incrementalUpdate.englishSetsTakenBack || ''}
                            onChange={(e) => setIncrementalUpdate({...incrementalUpdate, englishSetsTakenBack: e.target.value})}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                          />
                        </div>

                        {/* Free Sets Increment */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Free Sets Given</label>
                          <input
                            type="number"
                            placeholder="Add free sets"
                            value={incrementalUpdate.freeSetsGiven || ''}
                            onChange={(e) => setIncrementalUpdate({...incrementalUpdate, freeSetsGiven: e.target.value})}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                          />
                        </div>
                      </div>

                      {/* Add All Updates Button */}
                      <div className="flex justify-end">
                        <button
                          type="button"
                          onClick={addAllIncrementalUpdates}
                          className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium flex items-center"
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          Add All Updates
                        </button>
                      </div>

                      {/* Display recent updates */}
                      {schoolForm.updates && schoolForm.updates.length > 0 && (
                        <div className="mt-4 p-3 bg-white rounded border">
                          <h5 className="text-sm font-semibold text-gray-700 mb-2">Recent Increments:</h5>
                          <div className="space-y-1 text-xs">
                            {schoolForm.updates.slice(-3).map((update, idx) => (
                              <div key={idx} className="flex justify-between text-gray-600">
                                <span>
                                  {update.field
                                    ? `${update.field}: +${update.value}`
                                    : Object.entries(update)
                                        .filter(([k]) => k !== 'date' && k !== 'timestamp')
                                        .map(([k,v]) => `${k}: +${v}`)
                                        .join(' • ')
                                  }
                                </span>
                                <span>{new Date(update.date).toLocaleDateString()}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                  
                  {/* Contact Persons - Always shown */}
                  <div>
                    <h5 className="text-sm font-semibold text-gray-700 mb-3">Contact Persons</h5>
                      <div className="space-y-4">
                        {/* Contact Person 1 */}
                        <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                          <h6 className="text-xs font-medium text-gray-600 mb-3">Principal Details</h6>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
                              <input
                                type="text"
                                value={schoolForm.contact_person_1_name || ''}
                                onChange={(e) => setSchoolForm({...schoolForm, contact_person_1_name: e.target.value})}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
                              <input
                                type="tel"
                                value={schoolForm.contact_person_1_phone || ''}
                                onChange={(e) => setSchoolForm({...schoolForm, contact_person_1_phone: e.target.value})}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                              />
                            </div>
                          </div>
                        </div>
                        
                        {/* Contact Person 2 */}
                        <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                          <h6 className="text-xs font-medium text-gray-600 mb-3">Coordinator Details</h6>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
                              <input
                                type="text"
                                value={schoolForm.contact_person_2_name || ''}
                                onChange={(e) => setSchoolForm({...schoolForm, contact_person_2_name: e.target.value})}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
                              <input
                                type="tel"
                                value={schoolForm.contact_person_2_phone || ''}
                                onChange={(e) => setSchoolForm({...schoolForm, contact_person_2_phone: e.target.value})}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                              />
                            </div>
                          </div>
                        </div>
                        
                        {/* Contact Person 3 */}
                        <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                          <h6 className="text-xs font-medium text-gray-600 mb-3">Contact Person 3</h6>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
                              <input
                                type="text"
                                value={schoolForm.contact_person_3_name || ''}
                                onChange={(e) => setSchoolForm({...schoolForm, contact_person_3_name: e.target.value})}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
                              <input
                                type="tel"
                                value={schoolForm.contact_person_3_phone || ''}
                                onChange={(e) => setSchoolForm({...schoolForm, contact_person_3_phone: e.target.value})}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                  </div>
                  
                  {/* Email - Only shown when editing */}
                  {editingItem && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                      <input
                        type="email"
                        value={schoolForm.email}
                        onChange={(e) => setSchoolForm({...schoolForm, email: e.target.value})}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                      />
                    </div>
                  )}
                  
                  {/* Notes/Comments - Always shown */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Notes/Comments</label>
                    <textarea
                      value={schoolForm.notes}
                      onChange={(e) => setSchoolForm({...schoolForm, notes: e.target.value})}
                      rows="3"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                    ></textarea>
                  </div>
                  
                  <div className="flex justify-end space-x-3 pt-4">
                    <button
                      onClick={() => {
                        setShowModal(false);
                        setEditingItem(null);
                        // Clear undo history when cancelling
                        setUndoHistory([]);
                        setCanUndo(false);
                      }}
                      className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={editingItem ? updateSchool : addSchool}
                      className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
                    >
                      {editingItem ? 'Update' : 'Add'} School
                    </button>
                  </div>
                </div>
              )}

              {/* View School Details */}
              {modalType === 'viewSchool' && editingItem && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2 bg-orange-50 p-4 rounded-lg">
                      <h4 className="font-semibold text-lg text-gray-800 mb-2">{editingItem.schoolName}</h4>
                      <p className="text-gray-600">{editingItem.areaName}</p>
                    </div>
                    
                    <div>
                      <p className="text-sm text-gray-600">Date</p>
                      <p className="font-medium text-gray-800">{editingItem.date}</p>
                    </div>
                    
                    <div>
                      <p className="text-sm text-gray-600">Activity</p>
                      <p className="font-medium text-gray-800">{getSchoolActivity(editingItem)}</p>
                    </div>
                    
                    <div>
                      <p className="text-sm text-gray-600">Telugu Sets Distributed</p>
                      <p className="font-medium text-green-600">{editingItem.teluguSetsDistributed}</p>
                    </div>
                    
                    <div>
                      <p className="text-sm text-gray-600">English Sets Distributed</p>
                      <p className="font-medium text-green-600">{editingItem.englishSetsDistributed}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Money Collected</p>
                      <p className="font-medium text-green-700 text-lg">₹{editingItem.moneyCollected.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Total Sets Distributed</p>
                      <p className="font-medium text-green-700 text-lg">{editingItem.teluguSetsDistributed + editingItem.englishSetsDistributed}</p>
                    </div>
                    
                    <div>
                      <p className="text-sm text-gray-600">Telugu Sets Taken Back</p>
                      <p className="font-medium text-orange-600">{editingItem.teluguSetsTakenBack}</p>
                    </div>
                    
                    <div>
                      <p className="text-sm text-gray-600">English Sets Taken Back</p>
                      <p className="font-medium text-orange-600">{editingItem.englishSetsTakenBack}</p>
                    </div>
                    
                    
                    
                    <div>
                      <p className="text-sm text-gray-600">Telugu Sets Issued</p>
                      <p className="font-medium text-blue-600">{editingItem.teluguSetsIssued || 0}</p>
                    </div>
                    
                    <div>
                      <p className="text-sm text-gray-600">English Sets Issued</p>
                      <p className="font-medium text-blue-600">{editingItem.englishSetsIssued || 0}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Total Sets Taken Back</p>
                      <p className="font-medium text-orange-700 font-semibold">{editingItem.teluguSetsTakenBack + editingItem.englishSetsTakenBack}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Total Sets Issued</p>
                      <p className="font-medium text-blue-700 font-semibold">{(editingItem.teluguSetsIssued || 0) + (editingItem.englishSetsIssued || 0)}</p>
                    </div>
                    
                    <div>
                      <p className="text-sm text-gray-600">Free Sets Given</p>
                      <p className="font-medium text-purple-600">{editingItem.freeSetsGiven}</p>
                    </div>
                    
                    <div>
                      <p className="text-sm text-gray-600">Per Set Price</p>
                      <p className="font-medium text-gray-800">₹{editingItem.perSetPrice}</p>
                    </div>
                    
                    
                    
                    <div className="col-span-2 border-t pt-4">
                      <h5 className="font-semibold text-gray-800 mb-3">Contact Information</h5>
                      <div className="space-y-4">
                        {/* Contact Person 1 */}
                        <div className="border border-gray-200 rounded-lg p-3 bg-gray-50">
                          <h6 className="text-xs font-semibold text-gray-700 mb-2">Contact Person 1</h6>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <p className="text-sm text-gray-600">Name</p>
                              <p className="font-medium text-gray-800">{editingItem.contact_person_1_name || editingItem.contactPerson || 'N/A'}</p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-600">Phone</p>
                              <p className="font-medium text-gray-800">{editingItem.contact_person_1_phone || editingItem.contactNumber || 'N/A'}</p>
                            </div>
                          </div>
                        </div>
                        
                        {/* Contact Person 2 */}
                        <div className="border border-gray-200 rounded-lg p-3 bg-gray-50">
                          <h6 className="text-xs font-semibold text-gray-700 mb-2">Contact Person 2</h6>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <p className="text-sm text-gray-600">Name</p>
                              <p className="font-medium text-gray-800">{editingItem.contact_person_2_name || 'N/A'}</p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-600">Phone</p>
                              <p className="font-medium text-gray-800">{editingItem.contact_person_2_phone || 'N/A'}</p>
                            </div>
                          </div>
                        </div>
                        
                        {/* Contact Person 3 */}
                        <div className="border border-gray-200 rounded-lg p-3 bg-gray-50">
                          <h6 className="text-xs font-semibold text-gray-700 mb-2">Contact Person 3</h6>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <p className="text-sm text-gray-600">Name</p>
                              <p className="font-medium text-gray-800">{editingItem.contact_person_3_name || 'N/A'}</p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-600">Phone</p>
                              <p className="font-medium text-gray-800">{editingItem.contact_person_3_phone || 'N/A'}</p>
                            </div>
                          </div>
                        </div>
                        
                        {/* Email */}
                        <div>
                          <p className="text-sm text-gray-600">Email</p>
                          <p className="font-medium text-gray-800">{editingItem.email || 'N/A'}</p>
                        </div>
                      </div>
                    </div>
                    
                    {editingItem.notes && (
                      <div className="col-span-2 border-t pt-4">
                        <h5 className="font-semibold text-gray-800 mb-2">Notes</h5>
                        <p className="text-gray-700">{editingItem.notes}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Team Form */}
              {modalType === 'team' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Team Name *</label>
                    <input
                      type="text"
                      value={teamForm.name}
                      onChange={(e) => setTeamForm({...teamForm, name: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Username *</label>
                    <input
                      type="text"
                      value={teamForm.username}
                      onChange={(e) => setTeamForm({...teamForm, username: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Password *</label>
                    <input
                      type="password"
                      value={teamForm.password}
                      onChange={(e) => setTeamForm({...teamForm, password: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Contact Number *</label>
                    <input
                      type="tel"
                      value={teamForm.contact}
                      onChange={(e) => setTeamForm({...teamForm, contact: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                      required
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Gita Telugu</label>
                      <input
                        type="number"
                        value={teamForm.inventory.gitaTelugu}
                        onChange={(e) => setTeamForm({...teamForm, inventory: {...teamForm.inventory, gitaTelugu: parseInt(e.target.value) || 0}})}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Gita English</label>
                      <input
                        type="number"
                        value={teamForm.inventory.gitaEnglish}
                        onChange={(e) => setTeamForm({...teamForm, inventory: {...teamForm.inventory, gitaEnglish: parseInt(e.target.value) || 0}})}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Booklet Telugu</label>
                      <input
                        type="number"
                        value={teamForm.inventory.bookletTelugu}
                        onChange={(e) => setTeamForm({...teamForm, inventory: {...teamForm.inventory, bookletTelugu: parseInt(e.target.value) || 0}})}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Booklet English</label>
                      <input
                        type="number"
                        value={teamForm.inventory.bookletEnglish}
                        onChange={(e) => setTeamForm({...teamForm, inventory: {...teamForm.inventory, bookletEnglish: parseInt(e.target.value) || 0}})}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Calendar</label>
                      <input
                        type="number"
                        value={teamForm.inventory.calendar}
                        onChange={(e) => setTeamForm({...teamForm, inventory: {...teamForm.inventory, calendar: parseInt(e.target.value) || 0}})}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Chikki</label>
                      <input
                        type="number"
                        value={teamForm.inventory.chikki}
                        onChange={(e) => setTeamForm({...teamForm, inventory: {...teamForm.inventory, chikki: parseInt(e.target.value) || 0}})}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Pamphlets</label>
                      <input
                        type="number"
                        value={teamForm.inventory.pamphlets || 0}
                        onChange={(e) => setTeamForm({...teamForm, inventory: {...teamForm.inventory, pamphlets: parseInt(e.target.value) || 0}})}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                      />
                    </div>
                  </div>
                  
                  <div className="flex justify-end space-x-3 pt-4">
                    <button
                      onClick={() => setShowModal(false)}
                      className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={addTeam}
                      className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
                    >
                      Add Team
                    </button>
                  </div>
                </div>
              )}

              {/* Requirement Form */}
              {modalType === 'requirement' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Gita Telugu</label>
                      <input
                        type="number"
                        value={requirementForm.gitaTelugu}
                        onChange={(e) => setRequirementForm({...requirementForm, gitaTelugu: parseInt(e.target.value) || 0})}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Gita English</label>
                      <input
                        type="number"
                        value={requirementForm.gitaEnglish}
                        onChange={(e) => setRequirementForm({...requirementForm, gitaEnglish: parseInt(e.target.value) || 0})}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Booklet Telugu</label>
                      <input
                        type="number"
                        value={requirementForm.bookletTelugu}
                        onChange={(e) => setRequirementForm({...requirementForm, bookletTelugu: parseInt(e.target.value) || 0})}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Booklet English</label>
                      <input
                        type="number"
                        value={requirementForm.bookletEnglish}
                        onChange={(e) => setRequirementForm({...requirementForm, bookletEnglish: parseInt(e.target.value) || 0})}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Calendar</label>
                      <input
                        type="number"
                        value={requirementForm.calendar}
                        onChange={(e) => setRequirementForm({...requirementForm, calendar: parseInt(e.target.value) || 0})}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Chikki</label>
                      <input
                        type="number"
                        value={requirementForm.chikki}
                        onChange={(e) => setRequirementForm({...requirementForm, chikki: parseInt(e.target.value) || 0})}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                      />
                    </div>
                  </div>
                  
                  <div className="bg-blue-50 p-3 rounded-lg">
                    <p className="text-sm text-blue-800">
                      <span className="font-semibold">Total Items Required: </span>
                      {requirementForm.gitaTelugu + requirementForm.gitaEnglish + requirementForm.bookletTelugu + 
                       requirementForm.bookletEnglish + requirementForm.calendar + requirementForm.chikki}
                    </p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Reason *</label>
                    <textarea
                      value={requirementForm.reason}
                      onChange={(e) => setRequirementForm({...requirementForm, reason: e.target.value})}
                      rows="4"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                      placeholder="Explain why you need these sets..."
                      required
                    ></textarea>
                  </div>
                  
                  <div className="flex justify-end space-x-3 pt-4">
                    <button
                      onClick={() => setShowModal(false)}
                      className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={raiseRequirement}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Raise Requirement
                    </button>
                  </div>
                </div>
              )}

              {/* Settlement Form */}
              {modalType === 'settlement' && (
                <div className="space-y-4">
                  {currentUser.role === 'admin' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Select Team *</label>
                      <select
                        value={settlementForm.teamId}
                        onChange={(e) => setSettlementForm({...settlementForm, teamId: e.target.value})}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                        required
                      >
                        <option value="">-- Select a Team --</option>
                        {teams.map(team => (
                          <option key={team.id} value={team.id}>{team.name}</option>
                        ))}
                      </select>
                    </div>
                  )}
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Amount (₹) *</label>
                    <input
                      type="number"
                      value={settlementForm.amount}
                      onChange={(e) => setSettlementForm({...settlementForm, amount: parseFloat(e.target.value) || 0})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Payment Method *</label>
                    <select
                      value={settlementForm.paymentMethod}
                      onChange={(e) => setSettlementForm({...settlementForm, paymentMethod: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                      required
                    >
                      <option value="Cash">Cash</option>
                      <option value="UPI">UPI</option>
                      <option value="Bank Transfer">Bank Transfer</option>
                      <option value="RazorPay">RazorPay</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Date *</label>
                    <input
                      type="date"
                      value={settlementForm.date}
                      onChange={(e) => setSettlementForm({...settlementForm, date: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
                    <textarea
                      value={settlementForm.notes}
                      onChange={(e) => setSettlementForm({...settlementForm, notes: e.target.value})}
                      rows="3"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                      placeholder="Additional notes about the settlement..."
                    ></textarea>
                  </div>
                  
                  <div className="flex justify-end space-x-3 pt-4">
                    <button
                      onClick={() => setShowModal(false)}
                      className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={submitMoneySettlement}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                    >
                      Submit Settlement
                    </button>
                  </div>
                </div>
              )}

              {/* Expense Form */}
              {modalType === 'expense' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Amount (₹) *</label>
                    <input
                      type="number"
                      step="0.01"
                      value={expenseForm.amount}
                      onChange={(e) => setExpenseForm({...expenseForm, amount: parseFloat(e.target.value) || 0})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Description *</label>
                    <textarea
                      value={expenseForm.description}
                      onChange={(e) => setExpenseForm({...expenseForm, description: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                      rows="3"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Category *</label>
                    <select
                      value={expenseForm.category}
                      onChange={(e) => setExpenseForm({...expenseForm, category: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                      required
                    >
                      <option value="Travel">Travel</option>
                      <option value="Food">Food</option>
                      <option value="Accommodation">Accommodation</option>
                      <option value="Materials">Materials</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Date *</label>
                    <input
                      type="date"
                      value={expenseForm.date}
                      onChange={(e) => setExpenseForm({...expenseForm, date: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                      required
                    />
                  </div>
                  
                  <div className="flex justify-end space-x-3 pt-4">
                    <button
                      onClick={() => setShowModal(false)}
                      className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={submitExpense}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                    >
                      Submit Expense
                    </button>
                  </div>
                </div>
              )}

              {/* Bank Submission Form */}
              {modalType === 'bankSubmission' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Amount (₹) *</label>
                    <input
                      type="number"
                      step="0.01"
                      value={bankSubmissionForm.amount}
                      onChange={(e) => setBankSubmissionForm({...bankSubmissionForm, amount: parseFloat(e.target.value) || 0})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Date *</label>
                    <input
                      type="date"
                      value={bankSubmissionForm.date}
                      onChange={(e) => setBankSubmissionForm({...bankSubmissionForm, date: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
                    <textarea
                      value={bankSubmissionForm.notes}
                      onChange={(e) => setBankSubmissionForm({...bankSubmissionForm, notes: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                      rows="3"
                    />
                  </div>
                  
                  <div className="flex justify-end space-x-3 pt-4">
                    <button
                      onClick={() => setShowModal(false)}
                      className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={submitBankSubmission}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                    >
                      Submit to Bank
                    </button>
                  </div>
                </div>
              )}

              {/* Issue Inventory Form */}
              {modalType === 'issueInventory' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Select Team *</label>
                    <select
                      value={issueInventoryForm.teamId}
                      onChange={(e) => setIssueInventoryForm({...issueInventoryForm, teamId: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                      required
                    >
                      <option value="">Select a team</option>
                      {teams.map(team => (
                        <option key={team.id} value={team.id}>{team.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Issued Date *</label>
                    <input
                      type="date"
                      value={issueInventoryForm.issuedDate}
                      onChange={(e) => setIssueInventoryForm({...issueInventoryForm, issuedDate: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Contact Person *</label>
                    <input
                      type="text"
                      value={issueInventoryForm.contactPerson}
                      onChange={(e) => setIssueInventoryForm({...issueInventoryForm, contactPerson: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                      placeholder="Person receiving inventory"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Contact Phone *</label>
                    <input
                      type="tel"
                      value={issueInventoryForm.contactPhone}
                      onChange={(e) => setIssueInventoryForm({...issueInventoryForm, contactPhone: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                      placeholder="Phone number"
                      required
                    />
                  </div>

                  <div className="border-t pt-4">
                    <h4 className="text-sm font-semibold text-gray-700 mb-3">Inventory Items</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Gita Telugu</label>
                        <input
                          type="number"
                          value={issueInventoryForm.gitaTelugu || ''}
                          onChange={(e) => setIssueInventoryForm({...issueInventoryForm, gitaTelugu: e.target.value})}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                          min="0"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Booklet Telugu</label>
                        <input
                          type="number"
                          value={issueInventoryForm.bookletTelugu || ''}
                          onChange={(e) => setIssueInventoryForm({...issueInventoryForm, bookletTelugu: e.target.value})}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                          min="0"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Gita English</label>
                        <input
                          type="number"
                          value={issueInventoryForm.gitaEnglish || ''}
                          onChange={(e) => setIssueInventoryForm({...issueInventoryForm, gitaEnglish: e.target.value})}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                          min="0"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Booklet English</label>
                        <input
                          type="number"
                          value={issueInventoryForm.bookletEnglish || ''}
                          onChange={(e) => setIssueInventoryForm({...issueInventoryForm, bookletEnglish: e.target.value})}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                          min="0"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Calendar</label>
                        <input
                          type="number"
                          value={issueInventoryForm.calendar || ''}
                          onChange={(e) => setIssueInventoryForm({...issueInventoryForm, calendar: e.target.value})}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                          min="0"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Chikki</label>
                        <input
                          type="number"
                          value={issueInventoryForm.chikki || ''}
                          onChange={(e) => setIssueInventoryForm({...issueInventoryForm, chikki: e.target.value})}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                          min="0"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Pamphlets</label>
                        <input
                          type="number"
                          value={issueInventoryForm.pamphlets || ''}
                          onChange={(e) => setIssueInventoryForm({...issueInventoryForm, pamphlets: e.target.value})}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                          min="0"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end space-x-3 pt-4">
                    <button
                      onClick={() => {
                        setShowModal(false);
                      }}
                      className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={issueInventoryToTeam}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                    >
                      Issue Inventory
                    </button>
                  </div>
                </div>
              )}

              {/* Add Inventory Form */}
              {modalType === 'addInventory' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Date *</label>
                    <input
                      type="date"
                      value={addInventoryForm.date}
                      onChange={(e) => setAddInventoryForm({...addInventoryForm, date: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                      required
                    />
                  </div>

                  <div className="border-t pt-4">
                    <h4 className="text-sm font-semibold text-gray-700 mb-3">Inventory Items</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Gita Telugu</label>
                        <input
                          type="number"
                          value={addInventoryForm.gitaTelugu || ''}
                          onChange={(e) => setAddInventoryForm({...addInventoryForm, gitaTelugu: e.target.value})}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                          min="0"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Booklet Telugu</label>
                        <input
                          type="number"
                          value={addInventoryForm.bookletTelugu || ''}
                          onChange={(e) => setAddInventoryForm({...addInventoryForm, bookletTelugu: e.target.value})}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                          min="0"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Gita English</label>
                        <input
                          type="number"
                          value={addInventoryForm.gitaEnglish || ''}
                          onChange={(e) => setAddInventoryForm({...addInventoryForm, gitaEnglish: e.target.value})}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                          min="0"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Booklet English</label>
                        <input
                          type="number"
                          value={addInventoryForm.bookletEnglish || ''}
                          onChange={(e) => setAddInventoryForm({...addInventoryForm, bookletEnglish: e.target.value})}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                          min="0"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Calendar</label>
                        <input
                          type="number"
                          value={addInventoryForm.calendar || ''}
                          onChange={(e) => setAddInventoryForm({...addInventoryForm, calendar: e.target.value})}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                          min="0"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Chikki</label>
                        <input
                          type="number"
                          value={addInventoryForm.chikki || ''}
                          onChange={(e) => setAddInventoryForm({...addInventoryForm, chikki: e.target.value})}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                          min="0"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Pamphlets</label>
                        <input
                          type="number"
                          value={addInventoryForm.pamphlets || ''}
                          onChange={(e) => setAddInventoryForm({...addInventoryForm, pamphlets: e.target.value})}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                          min="0"
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Notes (Optional)</label>
                    <textarea
                      value={addInventoryForm.notes}
                      onChange={(e) => setAddInventoryForm({...addInventoryForm, notes: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                      rows="3"
                      placeholder="Additional notes about this inventory addition"
                    />
                  </div>

                  <div className="flex justify-end space-x-3 pt-4">
                    <button
                      onClick={() => {
                        setShowModal(false);
                      }}
                      className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={addInventoryToMaster}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                    >
                      Add to Master Inventory
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GitaDistributionPortal;
