import { db, auth } from './firebase';
import { auth } from './firebase-config';
import { onAuthStateChanged } from 'firebase/auth';

import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  getDocs, 
  query, 
  where,
  onSnapshot 
} from 'firebase/firestore';
import { 
  signInWithEmailAndPassword, 
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
  
  return () => unsubscribe();
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

  // UI State
  const [activeView, setActiveView] = useState('dashboard');
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState({ start: '', end: '' });
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState('');
  const [editingItem, setEditingItem] = useState(null);
  const [notifications, setNotifications] = useState([]);

  // Form states
  const [schoolForm, setSchoolForm] = useState({
    areaName: '', schoolName: '', announcementStatus: 'Pending',
    teluguSetsDistributed: 0, englishSetsDistributed: 0, 
    teluguSetsTakenBack: 0, englishSetsTakenBack: 0,
    teluguSetsOnHold: 0, englishSetsOnHold: 0,
    freeSetsGiven: 0,
    moneyCollected: 0, perSetPrice: 250, contactPerson: '',
    contactNumber: '', email: '', notes: '', date: new Date().toISOString().split('T')[0]
  });

  const [teamForm, setTeamForm] = useState({
    name: '', username: '', password: '', setsRemaining: 0, contact: ''
  });

  const [requirementForm, setRequirementForm] = useState({
    teluguQuantity: 0, englishQuantity: 0, reason: ''
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
    
    // Fetch user role from Firestore
    const userDoc = await getDocs(
      query(collection(db, 'users'), where('username', '==', username))
    );
    
    if (!userDoc.empty) {
      const userData = userDoc.docs[0].data();
      setCurrentUser({ ...userData, uid: userCredential.user.uid });
      setIsLoggedIn(true);
      
      if (userData.role === 'team') {
        setSelectedTeam(userData.teamId);
      }
    } else {
      alert('User data not found in database');
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
      const teamId = currentUser.role === 'admin' ? selectedTeam : currentUser.teamId;
      
      if (!teamId) {
        alert('Please select a team first');
        return;
      }
      
      const newSchool = {
        teamId: teamId,
        ...schoolForm,
        moneySettled: false,
        createdAt: new Date().toISOString()
      };
    
    await addDoc(collection(db, 'schools'), newSchool);
    
    // Update team's remaining sets
    const team = teams.find(t => t.id === teamId);
    if (team) {
      const totalSets = parseInt(schoolForm.teluguSetsDistributed) + 
                        parseInt(schoolForm.englishSetsDistributed) + 
                        parseInt(schoolForm.freeSetsGiven);
      const teamRef = doc(db, 'teams', teamId);
      await updateDoc(teamRef, {
        setsRemaining: team.setsRemaining - totalSets
      });
    }
    
    resetSchoolForm();
    setShowModal(false);
    alert('School added successfully!');
  } catch (error) {
    console.error('Error adding school:', error);
    alert('Error adding school. Please try again.');
  }
};

  const updateSchool = async () => {
  try {
    const schoolRef = doc(db, 'schools', editingItem.id);
    await updateDoc(schoolRef, schoolForm);
    
    resetSchoolForm();
    setEditingItem(null);
    setShowModal(false);
    alert('School updated successfully!');
  } catch (error) {
    console.error('Error updating school:', error);
    alert('Error updating school. Please try again.');
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
      // Validate inputs
      if (!teamForm.name || !teamForm.username || !teamForm.password || !teamForm.contact) {
        alert('Please fill in all required fields');
        return;
      }

      // Create Firebase Authentication user
      const email = `${teamForm.username}@gitaapp.com`;
      const userCredential = await createUserWithEmailAndPassword(auth, email, teamForm.password);
      const uid = userCredential.user.uid;

      // Create team document in Firestore
      const teamRef = await addDoc(collection(db, 'teams'), {
        name: teamForm.name,
        username: teamForm.username,
        contact: teamForm.contact,
        setsRemaining: parseInt(teamForm.setsRemaining) || 0,
        createdAt: new Date().toISOString(),
        uid: uid
      });

      // Create user document with role information
      await addDoc(collection(db, 'users'), {
        username: teamForm.username,
        name: teamForm.name,
        role: 'team',
        teamId: teamRef.id,
        uid: uid,
        contact: teamForm.contact,
        createdAt: new Date().toISOString()
      });

      resetTeamForm();
      setShowModal(false);
      alert('Team added successfully! They can now log in with their credentials.');
    } catch (error) {
      console.error('Error adding team:', error);
      if (error.code === 'auth/email-already-in-use') {
        alert('This username is already taken. Please choose a different username.');
      } else if (error.code === 'auth/weak-password') {
        alert('Password should be at least 6 characters long.');
      } else {
        alert('Error adding team: ' + error.message);
      }
    }
  };

  const raiseRequirement = async () => {
    try {
      const newReq = {
        teamId: currentUser.teamId,
        teamName: currentUser.name,
        teluguQuantity: parseInt(requirementForm.teluguQuantity) || 0,
        englishQuantity: parseInt(requirementForm.englishQuantity) || 0,
        reason: requirementForm.reason,
        status: 'pending',
        date: new Date().toISOString().split('T')[0],
        createdAt: new Date().toISOString()
      };
      
      await addDoc(collection(db, 'requirements'), newReq);
      
      setNotifications([...notifications, {
        id: Date.now(),
        message: `${currentUser.name} raised requirement for ${requirementForm.teluguQuantity} Telugu sets and ${requirementForm.englishQuantity} English sets`,
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
  // Reset forms
  const resetSchoolForm = () => {
    setSchoolForm({
      areaName: '', schoolName: '', announcementStatus: 'Pending',
      teluguSetsDistributed: 0, englishSetsDistributed: 0,
      teluguSetsTakenBack: 0, englishSetsTakenBack: 0,
      teluguSetsOnHold: 0, englishSetsOnHold: 0,
      freeSetsGiven: 0,
      moneyCollected: 0, perSetPrice: 250, contactPerson: '',
      contactNumber: '', email: '', notes: '', date: new Date().toISOString().split('T')[0]
    });
  };

  const resetTeamForm = () => {
    setTeamForm({ name: '', username: '', password: '', setsRemaining: 0, contact: '' });
  };

  const resetRequirementForm = () => {
    setRequirementForm({ teluguQuantity: 0, englishQuantity: 0, reason: '' });
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
    
    return {
      totalSchools: teamSchools.length,
      totalCollected,
      totalSettled,
      totalDistributed,
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
      filtered = filtered.filter(s => s.teamId === currentUser.id);
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
            {currentUser.role === 'admin' && (
              <>
                <button
                  onClick={() => setActiveView('teams')}
                  className={`px-6 py-3 font-medium ${activeView === 'teams' ? 'text-orange-600 border-b-2 border-orange-600' : 'text-gray-600 hover:text-orange-600'}`}
                >
                  Teams
                </button>
                <button
                  onClick={() => setActiveView('requirements')}
                  className={`px-6 py-3 font-medium ${activeView === 'requirements' ? 'text-orange-600 border-b-2 border-orange-600' : 'text-gray-600 hover:text-orange-600'}`}
                >
                  Requirements
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
                  onChange={(e) => setSelectedTeam(e.target.value ? parseInt(e.target.value) : null)}
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
              {(currentUser.role === 'admin' ? (selectedTeam ? [teams.find(t => t.id === selectedTeam)] : teams) : [currentUser]).map(team => {
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
                      
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Remaining Sets</span>
                        <div className="flex items-center space-x-2">
                          {currentUser.role === 'admin' ? (
                            <input
                              type="number"
                              value={team.setsRemaining}
                              onChange={(e) => updateTeamSets(team.id, e.target.value)}
                              className="w-20 px-2 py-1 border border-gray-300 rounded text-sm"
                            />
                          ) : (
                            <span className="font-semibold text-orange-600">{team.setsRemaining}</span>
                          )}
                        </div>
                      </div>
                      
                      <div className="border-t pt-3">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-sm text-gray-600">Total Collected</span>
                          <span className="font-semibold text-green-700">₹{stats.totalCollected.toLocaleString()}</span>
                        </div>
                        
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">Settled</span>
                          <span className="font-semibold text-blue-700">₹{stats.totalSettled.toLocaleString()}</span>
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
                      <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">Settled</th>
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
                        <td className="px-4 py-3 text-center">
                          {currentUser.role === 'admin' ? (
                            <button
                              onClick={() => toggleMoneySettled(school.id)}
                              className={`p-1 rounded ${school.moneySettled ? 'text-green-600' : 'text-gray-400'}`}
                            >
                              <Check className="w-5 h-5" />
                            </button>
                          ) : (
                            <span className={`text-sm ${school.moneySettled ? 'text-green-600' : 'text-gray-400'}`}>
                              {school.moneySettled ? 'Yes' : 'No'}
                            </span>
                          )}
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
                    <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">Telugu Qty</th>
                    <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">English Qty</th>
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
                      <td className="px-4 py-3 text-sm text-right text-gray-900 font-medium">{req.teluguQuantity}</td>
                      <td className="px-4 py-3 text-sm text-right text-gray-900 font-medium">{req.englishQuantity}</td>
                      <td className="px-4 py-3 text-sm text-right text-green-700 font-semibold">{req.teluguQuantity + req.englishQuantity}</td>
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
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Telugu Sets On Hold</label>
                      <input
                        type="number"
                        value={schoolForm.teluguSetsOnHold}
                        onChange={(e) => setSchoolForm({...schoolForm, teluguSetsOnHold: parseInt(e.target.value) || 0})}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">English Sets On Hold</label>
                      <input
                        type="number"
                        value={schoolForm.englishSetsOnHold}
                        onChange={(e) => setSchoolForm({...schoolForm, englishSetsOnHold: parseInt(e.target.value) || 0})}
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
                      <p className="text-sm text-gray-600">Telugu Sets On Hold</p>
                      <p className="font-medium text-blue-600">{editingItem.teluguSetsOnHold}</p>
                    </div>
                    
                    <div>
                      <p className="text-sm text-gray-600">English Sets On Hold</p>
                      <p className="font-medium text-blue-600">{editingItem.englishSetsOnHold}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Total Sets Taken Back</p>
                      <p className="font-medium text-orange-700 font-semibold">{editingItem.teluguSetsTakenBack + editingItem.englishSetsTakenBack}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Total Sets On Hold</p>
                      <p className="font-medium text-blue-700 font-semibold">{editingItem.teluguSetsOnHold + editingItem.englishSetsOnHold}</p>
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
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Initial Sets Remaining</label>
                    <input
                      type="number"
                      value={teamForm.setsRemaining}
                      onChange={(e) => setTeamForm({...teamForm, setsRemaining: parseInt(e.target.value) || 0})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
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
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Telugu Sets Needed *</label>
                      <input
                        type="number"
                        value={requirementForm.teluguQuantity}
                        onChange={(e) => setRequirementForm({...requirementForm, teluguQuantity: parseInt(e.target.value) || 0})}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                        required
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">English Sets Needed *</label>
                      <input
                        type="number"
                        value={requirementForm.englishQuantity}
                        onChange={(e) => setRequirementForm({...requirementForm, englishQuantity: parseInt(e.target.value) || 0})}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                        required
                      />
                    </div>
                  </div>
                  
                  <div className="bg-blue-50 p-3 rounded-lg">
                    <p className="text-sm text-blue-800">
                      <span className="font-semibold">Total Sets Required: </span>
                      {requirementForm.teluguQuantity + requirementForm.englishQuantity}
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
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GitaDistributionPortal;
