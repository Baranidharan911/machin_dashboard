// src/components/PrivateRoute.js
import React from 'react';
import { Navigate } from 'react-router-dom';
import { auth, db } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';
import { useAuthState } from 'react-firebase-hooks/auth';

const PrivateRoute = ({ children }) => {
  const [user] = useAuthState(auth);
  const [role, setRole] = React.useState(null);

  React.useEffect(() => {
    if (user) {
      const fetchUserRole = async () => {
        const docRef = doc(db, 'Users', user.uid);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          setRole(docSnap.data().role);
        } else {
          console.log('No such document!');
        }
      };
      fetchUserRole();
    }
  }, [user]);

  if (!user) {
    return <Navigate to="/login" />;
  }

  if (role !== 'admin') {
    return <Navigate to="/login" />;
  }

  return children;
};

export default PrivateRoute;
