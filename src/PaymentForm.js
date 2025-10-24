import React, { useState } from 'react';
import { doc, updateDoc, arrayUnion, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';

export const PaymentForm = ({ schoolId, onPaymentAdded }) => {
  const [payment, setPayment] = useState({
    amount: 0,
    mode: 'Cash',
    date: new Date().toISOString().split('T')[0]
  });

  const handleSubmit = async () => {
    try {
      const schoolRef = doc(db, 'schools', schoolId);
      
      const newPayment = {
        id: `payment_${Date.now()}`,
        ...payment,
        createdAt: serverTimestamp()
      };

      await updateDoc(schoolRef, {
        payments: arrayUnion(newPayment),
        lastUpdated: serverTimestamp(),
        updates: arrayUnion({
          type: 'payment',
          data: newPayment,
          timestamp: serverTimestamp(),
          updatedBy: auth.currentUser.uid
        })
      });

      // Reset form and notify parent
      setPayment({ amount: 0, mode: 'Cash', date: new Date().toISOString().split('T')[0] });
      if (onPaymentAdded) onPaymentAdded(newPayment);
      
    } catch (error) {
      console.error('Error adding payment:', error);
      alert('Error recording payment. Please try again.');
    }
  };

  // ... rest of your component code
};