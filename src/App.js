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
  onSnapshot 
} from 'firebase/firestore';
import { initializeApp, deleteApp } from 'firebase/app';
import { 
  signInWithEmailAndPassword,
  getAuth,
  signOut,
  createUserWithEmailAndPassword 
} from 'firebase/auth';
import React, { useState, useEffect } from 'react';
import { Search, Plus, Download, Users, BookOpen, DollarSign, Package, Bell, Edit2, Trash2, Eye, Filter, X, Check, AlertCircle, LogOut, Save } from 'lucide-react';

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

  // UI State
  const [activeView, setActiveView] = useState('dashboard');
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState({ start: '', end: '' });
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState('');
  const [editingItem, setEditingItem] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [moneySettlements, setMoneySettlements] = useState([]);
  const [settlementForm, setSettlementForm] = useState({
    amount: 0, paymentMethod: 'Cash', date: new Date().toISOString().split('T')[0], notes: ''
  });

  // Form states
  const [schoolForm, setSchoolForm] = useState({
    areaName: '', schoolName: '', announcementStatus: 'Pending',
    teluguSetsDistributed: 0, englishSetsDistributed: 0, 
    teluguSetsTakenBack: 0, englishSetsTakenBack: 0,
    teluguSetsIssued: 0, englishSetsIssued: 0, // Changed from "on hold" to "issued"
    freeSetsGiven: 0,
    moneyCollected: 0, perSetPrice: 250, contactPerson: '',
    contactNumber: '', email: '', notes: '', date: new Date().toISOString().split('T')[0],
    payments: [], // Array to track daily payments
    updates: [] // Array to track daily updates
  });

  // State for incremental updates in the update modal
  const [incrementalUpdate, setIncrementalUpdate] = useState({
    teluguSetsDistributed: 0,
    englishSetsDistributed: 0,
    teluguSetsTakenBack: 0,
    englishSetsTakenBack: 0,
    freeSetsGiven: 0,
    moneyCollected: 0,
    date: new Date().toISOString().split('T')[0]
  });

  const [teamForm, setTeamForm] = useState({
    name: '', username: '', password: '', contact: '',
    inventory: {
      gitaTelugu: 0, gitaEnglish: 0,
      bookletTelugu: 0, bookletEnglish: 0,
      calendar: 0, chikki: 0
    }
  });

  const [requirementForm, setRequirementForm] = useState({
    gitaTelugu: 0, gitaEnglish: 0,
    bookletTelugu: 0, bookletEnglish: 0,
    calendar: 0, chikki: 0,
    reason: ''
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
    
    // Check if sufficient inventory exists
    if (netTeluguSets > 0) {
      if ((currentInventory.gitaTelugu || 0) < netTeluguSets) {
        alert(`Insufficient Gita Telugu inventory. Available: ${currentInventory.gitaTelugu || 0}, Required: ${netTeluguSets}`);
        return;
      }
      if ((currentInventory.bookletTelugu || 0) < netTeluguSets) {
        alert(`Insufficient Booklet Telugu inventory. Available: ${currentInventory.bookletTelugu || 0}, Required: ${netTeluguSets}`);
        return;
      }
    }
    
    if (netEnglishSets > 0) {
      if ((currentInventory.gitaEnglish || 0) < netEnglishSets) {
        alert(`Insufficient Gita English inventory. Available: ${currentInventory.gitaEnglish || 0}, Required: ${netEnglishSets}`);
        return;
      }
      if ((currentInventory.bookletEnglish || 0) < netEnglishSets) {
        alert(`Insufficient Booklet English inventory. Available: ${currentInventory.bookletEnglish || 0}, Required: ${netEnglishSets}`);
        return;
      }
    }
    
    if (totalSetsNeeded > 0) {
      if ((currentInventory.calendar || 0) < totalSetsNeeded) {
        alert(`Insufficient Calendar inventory. Available: ${currentInventory.calendar || 0}, Required: ${totalSetsNeeded}`);
        return;
      }
      if ((currentInventory.chikki || 0) < totalSetsNeeded) {
        alert(`Insufficient Chikki inventory. Available: ${currentInventory.chikki || 0}, Required: ${totalSetsNeeded}`);
        return;
      }
    }
    
    // Calculate new inventory values
    const newInventory = {
      gitaTelugu: Math.max(0, (currentInventory.gitaTelugu || 0) - netTeluguSets),
      bookletTelugu: Math.max(0, (currentInventory.bookletTelugu || 0) - netTeluguSets),
      gitaEnglish: Math.max(0, (currentInventory.gitaEnglish || 0) - netEnglishSets),
      bookletEnglish: Math.max(0, (currentInventory.bookletEnglish || 0) - netEnglishSets),
      calendar: Math.max(0, (currentInventory.calendar || 0) - totalSetsNeeded),
      chikki: Math.max(0, (currentInventory.chikki || 0) - totalSetsNeeded)
    };
    
    console.log('New inventory will be:', newInventory);
    
    // Create school document
    const newSchool = {
      teamId: teamId,
      ...schoolForm,
      moneySettled: false,
      createdAt: new Date().toISOString()
    };
    
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
    
    // Validate that inventory doesn't go negative
    if (newInventory.gitaTelugu < 0) {
      alert(`Insufficient Gita Telugu inventory. Would result in: ${newInventory.gitaTelugu}`);
      return;
    }
    if (newInventory.bookletTelugu < 0) {
      alert(`Insufficient Booklet Telugu inventory. Would result in: ${newInventory.bookletTelugu}`);
      return;
    }
    if (newInventory.gitaEnglish < 0) {
      alert(`Insufficient Gita English inventory. Would result in: ${newInventory.gitaEnglish}`);
      return;
    }
    if (newInventory.bookletEnglish < 0) {
      alert(`Insufficient Booklet English inventory. Would result in: ${newInventory.bookletEnglish}`);
      return;
    }
    if (newInventory.calendar < 0) {
      alert(`Insufficient Calendar inventory. Would result in: ${newInventory.calendar}`);
      return;
    }
    if (newInventory.chikki < 0) {
      alert(`Insufficient Chikki inventory. Would result in: ${newInventory.chikki}`);
      return;
    }
    
    // Update school document
    console.log('Updating school document...');
    await updateDoc(schoolRef, schoolForm);
    console.log('School updated successfully');
    
    // Update team inventory
    console.log('Updating team inventory...');
    await updateDoc(teamDocRef, {
      inventory: newInventory
    });
    console.log('Inventory updated successfully');
    
    resetSchoolForm();
    setEditingItem(null);
    setShowModal(false);
    alert('School updated successfully and inventory adjusted!');
    
  } catch (error) {
    console.error('=== ERROR UPDATING SCHOOL ===');
    console.error('Error object:', error);
    console.error('Error code:', error.code);
    console.error('Error message:', error.message);
    console.error('============================');
    
    if (error.code === 'permission-denied') {
      alert('Permission denied. You may not have access to update this school or inventory.');
    } else {
      alert(`Error updating school: ${error.message}`);
    }
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
          chikki: parseInt(teamForm.inventory?.chikki) || 0
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
      
      const totalSets = newReq.gitaTelugu + newReq.gitaEnglish + newReq.bookletTelugu + 
                       newReq.bookletEnglish + newReq.calendar + newReq.chikki;
      
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
    const expectedAmount = netIssuedSets * (school.perSetPrice || 250);
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
      const settlementData = {
        teamId: currentUser.teamId,
        teamName: currentUser.name,
        amount: parseFloat(settlementForm.amount),
        paymentMethod: settlementForm.paymentMethod,
        date: settlementForm.date,
        notes: settlementForm.notes,
        status: 'pending',
        submittedAt: new Date().toISOString()
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
      await updateDoc(settlementRef, {
        status: 'approved',
        approvedAt: new Date().toISOString(),
        approvedBy: currentUser.uid
      });
      alert('Money settlement approved!');
    } catch (error) {
      console.error('Error approving settlement:', error);
      alert('Error approving settlement. Please try again.');
    }
  };
  // Reset forms
  const resetSchoolForm = () => {
    setSchoolForm({
      areaName: '', schoolName: '', announcementStatus: 'Pending',
      teluguSetsDistributed: 0, englishSetsDistributed: 0,
      teluguSetsTakenBack: 0, englishSetsTakenBack: 0,
      teluguSetsIssued: 0, englishSetsIssued: 0,
      freeSetsGiven: 0,
      moneyCollected: 0, perSetPrice: 250, contactPerson: '',
      contactNumber: '', email: '', notes: '', date: new Date().toISOString().split('T')[0],
      payments: [], updates: []
    });
    // Reset incremental update state
    setIncrementalUpdate({
      teluguSetsDistributed: 0,
      englishSetsDistributed: 0,
      teluguSetsTakenBack: 0,
      englishSetsTakenBack: 0,
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
    setSettlementForm({ amount: 0, paymentMethod: 'Cash', date: new Date().toISOString().split('T')[0], notes: '' });
  };

  // Calculations
  const getTeamStats = (teamId) => {
    const teamSchools = schools.filter(s => s.teamId === teamId);
    const totalCollected = teamSchools.reduce((sum, s) => sum + parseFloat(s.moneyCollected || 0), 0);
    const totalSettled = teamSchools.filter(s => s.moneySettled).reduce((sum, s) => sum + parseFloat(s.moneyCollected || 0), 0);
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
    return {
      totalSchools: teamSchools.length,
      totalCollected,
      totalSettled,
      totalDistributed,
      totalTeluguTakenBack,
      totalEnglishTakenBack,
      totalOnHold,
      totalTeluguDistributed,
      totalEnglishDistributed,
      totalFree,
      areas: [...new Set(teamSchools.map(s => s.areaName))].length
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
    
    return filtered;
  };

  // Export to CSV
  const exportToCSV = () => {
    const filtered = getFilteredSchools();
    const headers = ['Team', 'Area', 'School', 'Announcement', 'Telugu Sets', 'English Sets', 'Telugu Taken Back', 'English Taken Back', 'Telugu On Hold', 'English On Hold', 'Free Sets', 'Money Collected', 'Per Set', 'Settled', 'Date'];
    const rows = filtered.map(s => [
      teams.find(t => t.id === s.teamId)?.name,
      s.areaName,
      s.schoolName,
      s.announcementStatus,
      s.teluguSetsDistributed,
      s.englishSetsDistributed,
      s.teluguSetsTakenBack,
      s.englishSetsTakenBack,
      s.teluguSetsOnHold,
      s.englishSetsOnHold,
      s.freeSetsGiven,
      s.moneyCollected,
      s.perSetPrice,
      s.moneySettled ? 'Yes' : 'No',
      s.date
    ]);
    
    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `gita_distribution_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  // Login Screen
  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-orange-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl p-8 w-full max-w-md">
          <div className="text-center mb-8">
            <BookOpen className="w-16 h-16 text-orange-600 mx-auto mb-4" />
            <h1 className="text-3xl font-bold text-gray-800">Bhagavad Gita</h1>
            <p className="text-gray-600">Distribution Portal</p>
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
                <h1 className="text-2xl font-bold">Gita Distribution Portal</h1>
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
          <div className="flex space-x-1">
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
                  onClick={() => setActiveView('teams')}
                  className={`px-6 py-3 font-medium ${activeView === 'teams' ? 'text-orange-600 border-b-2 border-orange-600' : 'text-gray-600 hover:text-orange-600'}`}
                >
                  Teams
                </button>
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
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Dashboard View */}
        {activeView === 'dashboard' && (
          <div className="space-y-6">
            {/* Team Selector for Admin */}
            {currentUser.role === 'admin' && (
              <div className="bg-white rounded-lg shadow-md p-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Select Team</label>
                <select
                  value={selectedTeam || ''}
                  onChange={(e) => setSelectedTeam(e.target.value || null)}
                  //onChange={(e) => setSelectedTeam(e.target.value ? parseInt(e.target.value) : null)}
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
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">{team.name}</h3>
                    
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
                        
                        
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

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
                
                <button
                  onClick={exportToCSV}
                  className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
                >
                  <Download className="w-4 h-4" />
                  <span>Export Report</span>
                </button>
              </div>
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

            {/* Schools Table */}
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      {currentUser.role === 'admin' && <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Team</th>}
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Date</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Area</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">School</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Status</th>
                      <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">Telugu Sets</th>
                      <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">English Sets</th>
                      <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">Money</th>
                      <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">Difference</th>
                      <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {getFilteredSchools().map(school => (
                      <tr key={school.id} className="hover:bg-gray-50">
                        {currentUser.role === 'admin' && (
                          <td className="px-4 py-3 text-sm text-gray-900">
                            {teams.find(t => t.id === school.teamId)?.name}
                          </td>
                        )}
                        <td className="px-4 py-3 text-sm text-gray-600">{school.date}</td>
                        <td className="px-4 py-3 text-sm text-gray-900">{school.areaName}</td>
                        <td className="px-4 py-3 text-sm text-gray-900">{school.schoolName}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            school.announcementStatus === 'Completed' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                          }`}>
                            {school.announcementStatus}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-right text-gray-900">{school.teluguSetsDistributed}</td>
                        <td className="px-4 py-3 text-sm text-right text-gray-900">{school.englishSetsDistributed}</td>
                        <td className="px-4 py-3 text-sm text-right text-green-700 font-medium">
                          ₹{school.moneyCollected.toLocaleString()}
                        </td>
                        <td className="px-4 py-3 text-sm text-right">
                          <span className={`font-medium ${calculateMoneyDifference(school) >= 0 ? 'text-red-600' : 'text-green-600'}`}>
                            ₹{calculateMoneyDifference(school).toLocaleString()}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-center space-x-2">
                            <button
                              onClick={() => {
                                setEditingItem(school);
                                setSchoolForm(school);
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
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-orange-100">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Date & Time</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">School</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Area</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Field</th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700 uppercase">Increment Value</th>
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
                          // Filter by team (if admin)
                          if (currentUser.role === 'admin' && selectedTeam) {
                            return school.teamId === selectedTeam;
                          }
                          // Filter by current user's team if team member
                          if (currentUser.role === 'team') {
                            return school.teamId === currentUser.uid;
                          }
                          return true;
                        })
                        .filter(school => {
                          // Filter by search term
                          const searchLower = searchTerm.toLowerCase();
                          return searchLower === '' || 
                                 school.schoolName.toLowerCase().includes(searchLower) ||
                                 school.areaName.toLowerCase().includes(searchLower);
                        })
                        .filter(school => {
                          // Filter by date range
                          if (dateFilter.start && dateFilter.end) {
                            return school.updates.some(update => {
                              const updateDate = new Date(update.date);
                              return updateDate >= new Date(dateFilter.start) && 
                                     updateDate <= new Date(dateFilter.end);
                            });
                          } else if (dateFilter.start) {
                            return school.updates.some(update => {
                              const updateDate = new Date(update.date);
                              return updateDate >= new Date(dateFilter.start);
                            });
                          }
                          return true;
                        });

                      // Flatten updates with school info
                      const allUpdates = schoolsWithUpdates.flatMap(school => 
                        (school.updates || []).map(update => ({
                          ...update,
                          schoolId: school.id,
                          schoolName: school.schoolName,
                          areaName: school.areaName,
                          teamId: school.teamId,
                          teamName: teams.find(t => t.id === school.teamId)?.name || 'Unknown'
                        }))
                      );

                      // Sort by timestamp (newest first)
                      allUpdates.sort((a, b) => 
                        new Date(b.timestamp) - new Date(a.timestamp)
                      );

                      if (allUpdates.length === 0) {
                        return (
                          <tr>
                            <td colSpan={currentUser.role === 'admin' ? 6 : 5} className="px-4 py-12 text-center text-gray-500">
                              <Package className="w-12 h-12 mx-auto mb-4 opacity-50" />
                              <p>No updates found</p>
                            </td>
                          </tr>
                        );
                      }

                      return allUpdates.map((update, idx) => (
                        <tr key={idx} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm text-gray-600">
                            <div>{new Date(update.date).toLocaleDateString()}</div>
                            <div className="text-xs text-gray-400">{new Date(update.timestamp).toLocaleTimeString()}</div>
                          </td>
                          <td className="px-4 py-3 text-sm font-medium text-gray-900">{update.schoolName}</td>
                          <td className="px-4 py-3 text-sm text-gray-600">{update.areaName}</td>
                          <td className="px-4 py-3 text-sm">
                            <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium capitalize">
                              {update.field.replace(/([A-Z])/g, ' $1').trim()}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm text-right font-semibold text-green-600">
                            +{typeof update.value === 'number' ? update.value : parseFloat(update.value)}
                          </td>
                          {currentUser.role === 'admin' && (
                            <td className="px-4 py-3 text-sm text-gray-600">{update.teamName}</td>
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

        {/* Teams View (Admin Only) */}
        {activeView === 'teams' && currentUser.role === 'admin' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-800">Manage Teams</h2>
              <button
                onClick={() => {
                  setModalType('team');
                  resetTeamForm();
                  setShowModal(true);
                }}
                className="flex items-center space-x-2 bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>Add Team</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {teams.map(team => {
                const stats = getTeamStats(team.id);
                return (
                  <div key={team.id} className="bg-white rounded-lg shadow-md p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-800">{team.name}</h3>
                        <p className="text-sm text-gray-600">{team.contact}</p>
                      </div>
                      <Users className="w-8 h-8 text-orange-600" />
                    </div>
                    
                    <div className="space-y-2 mb-4">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Username:</span>
                        <span className="font-medium text-gray-800">{team.username}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Schools:</span>
                        <span className="font-medium text-gray-800">{stats.totalSchools}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Telugu Sets:</span>
                        <span className="font-medium text-gray-800">{stats.totalTeluguDistributed}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">English Sets:</span>
                        <span className="font-medium text-gray-800">{stats.totalEnglishDistributed}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Total Sets:</span>
                        <span className="font-medium text-green-600">{stats.totalDistributed}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Money Collected:</span>
                        <span className="font-medium text-green-700">₹{stats.totalCollected.toLocaleString()}</span>
                      </div>
                    </div>
                    
                    <div className="border-t pt-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">Remaining Sets</label>
                      <input
                        type="number"
                        value={team.setsRemaining}
                        onChange={(e) => updateTeamSets(team.id, e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Requirements View (Admin Only) */}
        {activeView === 'requirements' && currentUser.role === 'admin' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-800">Set Requirements</h2>

            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <table className="w-full">
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
              {currentUser.role === 'team' && (
                <button
                  onClick={() => {
                    setModalType('settlement');
                    resetSettlementForm();
                    setShowModal(true);
                  }}
                  className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
                >
                  <DollarSign className="w-4 h-4" />
                  <span>Submit Settlement</span>
                </button>
              )}
            </div>

            {currentUser.role === 'admin' ? (
              <div className="bg-white rounded-lg shadow-md overflow-hidden">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Date</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Team</th>
                      <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">Amount</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Method</th>
                      <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">Status</th>
                      <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {moneySettlements.map(settlement => (
                      <tr key={settlement.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm text-gray-600">{settlement.date}</td>
                        <td className="px-4 py-3 text-sm text-gray-900">{settlement.teamName}</td>
                        <td className="px-4 py-3 text-sm text-right text-green-700 font-medium">₹{settlement.amount.toLocaleString()}</td>
                        <td className="px-4 py-3 text-sm text-gray-700">{settlement.paymentMethod}</td>
                        <td className="px-4 py-3 text-center">
                          <span className={`px-3 py-1 text-xs rounded-full ${
                            settlement.status === 'approved' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                          }`}>
                            {settlement.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          {settlement.status === 'pending' && (
                            <button
                              onClick={() => approveMoneySettlement(settlement.id)}
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
                
                {moneySettlements.length === 0 && (
                  <div className="text-center py-12 text-gray-500">
                    <DollarSign className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No money settlements submitted</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Your Settlement History</h3>
                <div className="space-y-3">
                  {moneySettlements.filter(s => s.teamId === currentUser.teamId).map(settlement => (
                    <div key={settlement.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="font-medium text-gray-800">₹{settlement.amount.toLocaleString()}</p>
                          <p className="text-sm text-gray-600">{settlement.paymentMethod} • {settlement.date}</p>
                        </div>
                        <span className={`px-3 py-1 text-xs rounded-full ${
                          settlement.status === 'approved' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                        }`}>
                          {settlement.status}
                        </span>
                      </div>
                      {settlement.notes && (
                        <p className="text-sm text-gray-600 mt-2">{settlement.notes}</p>
                      )}
                    </div>
                  ))}
                  
                  {moneySettlements.filter(s => s.teamId === currentUser.teamId).length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      <DollarSign className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      <p>No settlements submitted yet</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Notifications View */}
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
                <h2 className="text-2xl font-bold text-gray-800">Inventory Management</h2>
                
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
                            <div className="grid grid-cols-2 gap-2">
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
                            <div className="grid grid-cols-2 gap-2">
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
                            <div className="grid grid-cols-2 gap-2">
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
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
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
                                 (team.inventory.chikki || 0)}
                              </div>
                            </div>
                            <div>
                              <div className="text-sm text-gray-600 mb-1">Total Accessories</div>
                              <div className="text-3xl font-bold text-blue-700">
                                {(team.inventory.calendar || 0) + (team.inventory.chikki || 0)}
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
                              <BookOpen className="w-5 h-5" />
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
                              <BookOpen className="w-5 h-5" />
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
                              <Package className="w-5 h-5" />
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
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </>
            )}
          </div>
        )}
      </main>

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
              </h3>
              <button
                onClick={() => {
                  setShowModal(false);
                  setEditingItem(null);
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-6 h-6" />
              </button>
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
                      <label className="block text-sm font-medium text-gray-700 mb-2">Date *</label>
                      <input
                        type="date"
                        value={schoolForm.date}
                        onChange={(e) => setSchoolForm({...schoolForm, date: e.target.value})}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                        required
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Announcement Status</label>
                      <select
                        value={schoolForm.announcementStatus}
                        onChange={(e) => setSchoolForm({...schoolForm, announcementStatus: e.target.value})}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                      >
                        <option value="Pending">Pending</option>
                        <option value="Completed">Completed</option>
                      </select>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Telugu Sets Distributed</label>
                        <input
                          type="number"
                          value={schoolForm.teluguSetsDistributed}
                          onChange={(e) => setSchoolForm({...schoolForm, teluguSetsDistributed: parseInt(e.target.value) || 0})}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">English Sets Distributed</label>
                        <input
                          type="number"
                          value={schoolForm.englishSetsDistributed}
                          onChange={(e) => setSchoolForm({...schoolForm, englishSetsDistributed: parseInt(e.target.value) || 0})}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Money Collected (₹)</label>
                      <input
                        type="number"
                        value={schoolForm.moneyCollected}
                        onChange={(e) => setSchoolForm({...schoolForm, moneyCollected: parseInt(e.target.value) || 0})}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Telugu Sets Taken Back</label>
                      <input
                        type="number"
                        value={schoolForm.teluguSetsTakenBack}
                        onChange={(e) => setSchoolForm({...schoolForm, teluguSetsTakenBack: parseInt(e.target.value) || 0})}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">English Sets Taken Back</label>
                      <input
                        type="number"
                        value={schoolForm.englishSetsTakenBack}
                        onChange={(e) => setSchoolForm({...schoolForm, englishSetsTakenBack: parseInt(e.target.value) || 0})}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                      />
                    </div>
                  </div>

                  {/* Incremental Updates Section - Only shown when editing */}
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
                        <div className="flex gap-2">
                          <input
                            type="number"
                            placeholder="Add amount"
                            value={incrementalUpdate.moneyCollected || ''}
                            onChange={(e) => setIncrementalUpdate({...incrementalUpdate, moneyCollected: e.target.value})}
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                          />
                          <button
                            type="button"
                            onClick={() => addIncrementalUpdate('moneyCollected', incrementalUpdate.moneyCollected)}
                            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
                          >
                            Add ₹
                          </button>
                        </div>

                        {/* Telugu Sets Distributed Increment */}
                        <div className="flex gap-2">
                          <input
                            type="number"
                            placeholder="Add telugu sets"
                            value={incrementalUpdate.teluguSetsDistributed || ''}
                            onChange={(e) => setIncrementalUpdate({...incrementalUpdate, teluguSetsDistributed: e.target.value})}
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                          />
                          <button
                            type="button"
                            onClick={() => addIncrementalUpdate('teluguSetsDistributed', incrementalUpdate.teluguSetsDistributed)}
                            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
                          >
                            Add
                          </button>
                        </div>

                        {/* English Sets Distributed Increment */}
                        <div className="flex gap-2">
                          <input
                            type="number"
                            placeholder="Add english sets"
                            value={incrementalUpdate.englishSetsDistributed || ''}
                            onChange={(e) => setIncrementalUpdate({...incrementalUpdate, englishSetsDistributed: e.target.value})}
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                          />
                          <button
                            type="button"
                            onClick={() => addIncrementalUpdate('englishSetsDistributed', incrementalUpdate.englishSetsDistributed)}
                            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
                          >
                            Add
                          </button>
                        </div>

                        {/* Telugu Sets Taken Back Increment */}
                        <div className="flex gap-2">
                          <input
                            type="number"
                            placeholder="Add telugu returned"
                            value={incrementalUpdate.teluguSetsTakenBack || ''}
                            onChange={(e) => setIncrementalUpdate({...incrementalUpdate, teluguSetsTakenBack: e.target.value})}
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                          />
                          <button
                            type="button"
                            onClick={() => addIncrementalUpdate('teluguSetsTakenBack', incrementalUpdate.teluguSetsTakenBack)}
                            className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors text-sm font-medium"
                          >
                            Add
                          </button>
                        </div>

                        {/* English Sets Taken Back Increment */}
                        <div className="flex gap-2">
                          <input
                            type="number"
                            placeholder="Add english returned"
                            value={incrementalUpdate.englishSetsTakenBack || ''}
                            onChange={(e) => setIncrementalUpdate({...incrementalUpdate, englishSetsTakenBack: e.target.value})}
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                          />
                          <button
                            type="button"
                            onClick={() => addIncrementalUpdate('englishSetsTakenBack', incrementalUpdate.englishSetsTakenBack)}
                            className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors text-sm font-medium"
                          >
                            Add
                          </button>
                        </div>

                        {/* Free Sets Increment */}
                        <div className="flex gap-2">
                          <input
                            type="number"
                            placeholder="Add free sets"
                            value={incrementalUpdate.freeSetsGiven || ''}
                            onChange={(e) => setIncrementalUpdate({...incrementalUpdate, freeSetsGiven: e.target.value})}
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                          />
                          <button
                            type="button"
                            onClick={() => addIncrementalUpdate('freeSetsGiven', incrementalUpdate.freeSetsGiven)}
                            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm font-medium"
                          >
                            Add
                          </button>
                        </div>
                      </div>

                      {/* Display recent updates */}
                      {schoolForm.updates && schoolForm.updates.length > 0 && (
                        <div className="mt-4 p-3 bg-white rounded border">
                          <h5 className="text-sm font-semibold text-gray-700 mb-2">Recent Increments:</h5>
                          <div className="space-y-1 text-xs">
                            {schoolForm.updates.slice(-3).map((update, idx) => (
                              <div key={idx} className="flex justify-between text-gray-600">
                                <span>{update.field}: +{update.value}</span>
                                <span>{new Date(update.date).toLocaleDateString()}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Telugu Sets Issued</label>
                      <input
                        type="number"
                        value={schoolForm.teluguSetsIssued}
                        onChange={(e) => setSchoolForm({...schoolForm, teluguSetsIssued: parseInt(e.target.value) || 0})}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">English Sets Issued</label>
                      <input
                        type="number"
                        value={schoolForm.englishSetsIssued}
                        onChange={(e) => setSchoolForm({...schoolForm, englishSetsIssued: parseInt(e.target.value) || 0})}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Free Sets Given</label>
                      <input
                        type="number"
                        value={schoolForm.freeSetsGiven}
                        onChange={(e) => setSchoolForm({...schoolForm, freeSetsGiven: parseInt(e.target.value) || 0})}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Per Set Price (₹)</label>
                      <input
                        type="number"
                        value={schoolForm.perSetPrice}
                        onChange={(e) => setSchoolForm({...schoolForm, perSetPrice: parseInt(e.target.value) || 0})}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                      />
                    </div>
                    
                    
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Contact Person</label>
                      <input
                        type="text"
                        value={schoolForm.contactPerson}
                        onChange={(e) => setSchoolForm({...schoolForm, contactPerson: e.target.value})}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Contact Number</label>
                      <input
                        type="tel"
                        value={schoolForm.contactNumber}
                        onChange={(e) => setSchoolForm({...schoolForm, contactNumber: e.target.value})}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                    <input
                      type="email"
                      value={schoolForm.email}
                      onChange={(e) => setSchoolForm({...schoolForm, email: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                  
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
                      <p className="text-sm text-gray-600">Announcement Status</p>
                      <p className="font-medium text-gray-800">{editingItem.announcementStatus}</p>
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
                      <h5 className="font-semibold text-gray-800 mb-2">Contact Information</h5>
                      <div className="space-y-2">
                        <div>
                          <p className="text-sm text-gray-600">Contact Person</p>
                          <p className="font-medium text-gray-800">{editingItem.contactPerson || 'N/A'}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Phone</p>
                          <p className="font-medium text-gray-800">{editingItem.contactNumber || 'N/A'}</p>
                        </div>
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
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GitaDistributionPortal;
