import React, { useEffect, useState } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';

export const PaymentHistory = ({ schoolId }) => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Set up real-time listener for payments
    const schoolRef = doc(db, 'schools', schoolId);
    const unsubscribe = onSnapshot(schoolRef, (doc) => {
      if (doc.exists()) {
        const schoolData = doc.data();
        setPayments(schoolData.payments || []);
      }
      setLoading(false);
    });

    // Cleanup listener on component unmount
    return () => unsubscribe();
  }, [schoolId]);

  // Group payments by date
  const paymentsByDate = payments.reduce((acc, payment) => {
    if (!acc[payment.date]) {
      acc[payment.date] = {
        total: 0,
        modes: { Cash: 0, UPI: 0, 'Bank Transfer': 0 }
      };
    }
    acc[payment.date].total += payment.amount;
    acc[payment.date].modes[payment.mode] += payment.amount;
    return acc;
  }, {});

  if (loading) {
    return <div>Loading payment history...</div>;
  }

  return (
    <div className="space-y-4">
      {Object.entries(paymentsByDate).map(([date, data]) => (
        <div key={date} className="bg-white rounded-lg shadow p-4">
          <div className="flex justify-between items-center mb-3">
            <h4 className="font-medium text-gray-800">
              {new Date(date).toLocaleDateString()}
            </h4>
            <span className="font-medium text-green-600">
              ₹{data.total.toLocaleString()}
            </span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {Object.entries(data.modes).map(([mode, amount]) => 
              amount > 0 && (
                <div key={mode} className="text-sm">
                  <span className="text-gray-600">{mode}:</span>
                  <span className="ml-2 font-medium">₹{amount}</span>
                </div>
              )
            )}
          </div>
        </div>
      ))}
    </div>
  );
};