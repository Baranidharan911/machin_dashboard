import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { auth, db, storage } from '../firebase'; 
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { setDoc, doc, collection, getDocs, updateDoc, deleteDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { Pie, Bar } from 'react-chartjs-2';
import 'chart.js/auto';
import '../styles/Register.css';
import Header from './Header';
import { FaUser, FaPhone, FaEnvelope, FaLock, FaIdCard, FaCalendar, FaStar } from 'react-icons/fa';

function Register() {
  const { register, handleSubmit, watch, formState: { errors } } = useForm();
  const [profilePic, setProfilePic] = useState(null);
  const [uploading, setUploading] = useState(false); 
  const [userData, setUserData] = useState({
    activeUsers: 0,
    inactiveUsers: 0,
    totalRegistered: 0,
    userCounts: []
  });
  const [users, setUsers] = useState([]);
  const [isEditing, setIsEditing] = useState(null);
  const [editData, setEditData] = useState({
    fullName: '',
    phoneNumber: '',
    email: '',
    gymMembershipId: '',
    dateOfRegistration: '',
    endDate: '',
    package: '',
    profilePicture: null,
    membershipStatus: '',
  });

  const onSubmit = async (data) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, data.email, data.password);
      const user = userCredential.user;

      let profilePicUrl = null;

      if (profilePic) {
        setUploading(true);
        const storageRef = ref(storage, `profile_pics/${user.uid}/${profilePic.name}`);
        await uploadBytes(storageRef, profilePic);
        profilePicUrl = await getDownloadURL(storageRef);
        setUploading(false);
      }

      await setDoc(doc(db, 'customer', user.uid), {
        fullName: data.fullName,
        phoneNumber: data.phoneNumber,
        email: data.email,
        gymMembershipId: data.gymMembershipId,
        membershipStatus: data.membershipStatus,
        subscriptionPackage: data.subscriptionPackage,
        dateOfRegistration: data.dateOfRegistration,
        profilePicture: profilePicUrl,
      });

      alert("Customer registered successfully!");
    } catch (error) {
      console.error("Error registering customer: ", error);
      alert("An error occurred during registration. Please try again.");
    }
  };

  const handleProfilePicChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setProfilePic(file);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      const usersSnapshot = await getDocs(collection(db, 'customer'));
      const users = usersSnapshot.docs.map(doc => doc.data());

      const activeUsers = users.filter(user => user.membershipStatus === 'Active').length;
      const inactiveUsers = users.filter(user => user.membershipStatus !== 'Active').length;
      const totalRegistered = users.length;

      const userCounts = [
        { time: '1am', count: 5 },
        { time: '2am', count: 15 },
        { time: '3am', count: 8 },
        { time: '4pm', count: 10 },
      ];

      setUserData({ activeUsers, inactiveUsers, totalRegistered, userCounts });

      const userList = usersSnapshot.docs.map(userDoc => {
        const userData = userDoc.data();
        const endDate = calculateEndDate(userData.dateOfRegistration, userData.subscriptionPackage);
        return { id: userDoc.id, ...userData, endDate };
      });
      setUsers(userList);
    };

    fetchData();
  }, []);

  const calculateEndDate = (startDate, subscriptionPackage) => {
    const startDateObj = new Date(startDate);
    let endDateObj = new Date(startDateObj);

    if (subscriptionPackage.includes('Year')) {
      const years = parseInt(subscriptionPackage.split(' ')[0], 10);
      endDateObj.setFullYear(startDateObj.getFullYear() + years);
    } else if (subscriptionPackage.includes('Month')) {
      const months = parseInt(subscriptionPackage.split(' ')[0], 10);
      endDateObj.setMonth(startDateObj.getMonth() + months);
    }

    return endDateObj.toISOString().split('T')[0];
  };

  const handleEditClick = (user) => {
    setIsEditing(user.id);
    setEditData({
      fullName: user.fullName,
      phoneNumber: user.phoneNumber,
      email: user.email,
      gymMembershipId: user.gymMembershipId,
      dateOfRegistration: user.dateOfRegistration,
      endDate: user.endDate || '',
      package: user.subscriptionPackage,
      profilePicture: user.profilePicture,
      membershipStatus: user.membershipStatus,
    });
  };

  const handleSaveClick = async () => {
    const userDocRef = doc(db, 'customer', isEditing);

    if (editData.profilePicture instanceof File) {
      const storageRef = ref(storage, `profile_pics/${isEditing}/${editData.profilePicture.name}`);
      await uploadBytes(storageRef, editData.profilePicture);
      const profilePicUrl = await getDownloadURL(storageRef);
      editData.profilePicture = profilePicUrl;
    }

    const endDate = calculateEndDate(editData.dateOfRegistration, editData.package);

    await updateDoc(userDocRef, {
      fullName: editData.fullName,
      phoneNumber: editData.phoneNumber,
      email: editData.email,
      gymMembershipId: editData.gymMembershipId,
      dateOfRegistration: editData.dateOfRegistration,
      endDate,
      subscriptionPackage: editData.package,
      profilePicture: editData.profilePicture,
      membershipStatus: editData.membershipStatus,
    });

    setUsers(users.map(user => (user.id === isEditing ? { ...user, ...editData, endDate } : user)));
    setIsEditing(null);
    setEditData({
      fullName: '',
      phoneNumber: '',
      email: '',
      gymMembershipId: '',
      dateOfRegistration: '',
      endDate: '',
      package: '',
      profilePicture: null,
      membershipStatus: '',
    });
  };

  const handleCancelClick = () => {
    setIsEditing(null);
    setEditData({
      fullName: '',
      phoneNumber: '',
      email: '',
      gymMembershipId: '',
      dateOfRegistration: '',
      endDate: '',
      package: '',
      profilePicture: null,
      membershipStatus: '',
    });
  };

  const handleRemoveClick = async (userId) => {
    const userDocRef = doc(db, 'customer', userId);
    await deleteDoc(userDocRef);
    setUsers(users.filter(user => user.id !== userId));
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEditData(prevData => ({ ...prevData, [name]: value }));
  };

  const handleProfilePicChangeEdit = (e) => {
    const file = e.target.files[0];
    setEditData(prevData => ({ ...prevData, profilePicture: file }));
  };

  const pieData = {
    labels: ['Active Users', 'Inactive Users', 'Total Registered'],
    datasets: [
      {
        label: 'User Distribution',
        data: [
          userData.activeUsers,
          userData.inactiveUsers,
          userData.totalRegistered
        ],
        backgroundColor: ['#98FB98', '#FF6384', '#007FFF'],
      }
    ]
  };

  const barData = {
    labels: userData.userCounts.map(data => data.time),
    datasets: [
      {
        label: 'User Count',
        data: userData.userCounts.map(data => data.count),
        backgroundColor: (context) => {
          const chart = context.chart;
          const { ctx, chartArea } = chart;

          if (!chartArea) {
            return null;
          }

          const gradient = ctx.createLinearGradient(0, chartArea.bottom, 0, chartArea.top);
          gradient.addColorStop(0, '#800080'); 
          gradient.addColorStop(1, '#EE82EE'); 

          return gradient;
        }
      }
    ]
  };

  return (
    <div className="register_page_form_unique">
      <Header />
      <h2>User Analytics</h2>
      <div className="form_analytics_wrapper_form_unique">
        <div className="form_wrapper_form_unique">
          <div className="form_container_form_unique">
            <div className="title_container_form_unique">
              <h2>Register Page</h2>
            </div>
            <div className="row_form_unique clearfix">
              <div className="">
                <form onSubmit={handleSubmit(onSubmit)}>
                  <div className="input_field_form_unique">
                    <FaUser />
                    <input
                      type="text"
                      placeholder="Full Name"
                      {...register('fullName', { required: true })}
                    />
                    {errors.fullName && <span>This field is required</span>}
                  </div>

                  <div className="input_field_form_unique">
                    <FaPhone />
                    <input
                      type="text"
                      placeholder="Phone Number"
                      {...register('phoneNumber', { required: true })}
                    />
                    {errors.phoneNumber && <span>This field is required</span>}
                  </div>

                  <div className="input_field_form_unique">
                    <FaEnvelope />
                    <input
                      type="email"
                      placeholder="Email"
                      {...register('email', { required: true })}
                    />
                    {errors.email && <span>This field is required</span>}
                  </div>

                  <div className="input_field_form_unique">
                    <FaLock />
                    <input
                      type="password"
                      placeholder="Password"
                      {...register('password', { required: true })}
                    />
                    {errors.password && <span>This field is required</span>}
                  </div>

                  <div className="input_field_form_unique">
                    <FaLock />
                    <input
                      type="password"
                      placeholder="Confirm Password"
                      {...register('confirmPassword', {
                        required: true,
                        validate: (value) => value === watch('password'),
                      })}
                    />
                    {errors.confirmPassword && <span>Passwords do not match</span>}
                  </div>

                  <div className="input_field_form_unique">
                    <FaIdCard />
                    <input
                      type="text"
                      placeholder="Gym Membership ID"
                      {...register('gymMembershipId', { required: true })}
                    />
                    {errors.gymMembershipId && <span>This field is required</span>}
                  </div>

                  <div className="input_field_form_unique">
                    <FaStar />
                    <input
                      type="text"
                      placeholder="Membership Status"
                      {...register('membershipStatus', { required: true })}
                    />
                    {errors.membershipStatus && <span>This field is required</span>}
                  </div>

                  <div className="input_field_form_unique">
                    <FaStar />
                    <input
                      type="text"
                      placeholder="Subscription Package"
                      {...register('subscriptionPackage', { required: true })}
                    />
                    {errors.subscriptionPackage && <span>This field is required</span>}
                  </div>

                  <div className="input_field_form_unique">
                    <FaCalendar />
                    <input
                      type="date"
                      placeholder="Date of Registration"
                      {...register('dateOfRegistration', { required: true })}
                    />
                    {errors.dateOfRegistration && <span>This field is required</span>}
                  </div>

                  <div className="input_field_form_unique">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleProfilePicChange}
                    />
                  </div>

                  <input className="button_form_unique" type="submit" value={uploading ? "Registering..." : "Register"} disabled={uploading} />
                </form>
              </div>
            </div>
          </div>
        </div>

        {/* User Analytics Section */}
        <div className="user_analytics_form_unique">
          <h2>User Analytics</h2>
          <div className="pie_chart_container_form_unique">
            <Pie data={pieData} />
          </div>
          <div className="bar_chart_container_form_unique">
            <Bar data={barData} />
            <p>User Count Respect to Time</p>
          </div>
        </div>
      </div>

      {/* User Table Section */}
      <div className="user_table_container_form_unique">
        <div className="user_table">
          <div className="user_table_search">
            <input type="text" placeholder="Search..." />
          </div>
          <table>
            <thead>
            <tr className='unique'>
              <th>Name</th>
              <th>Ph No</th>
              <th>Email</th>
              <th>ID</th>
              <th>Package</th>
              <th>Status</th>
              <th>D.OF.REG</th>
              <th>End Date</th>
              <th>Profile</th>
              <th>Actions</th>
            </tr>

            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id}>
                  <td>
                    {isEditing === user.id ? (
                      <input
                        type="text"
                        name="fullName"
                        value={editData.fullName}
                        onChange={handleInputChange}
                      />
                    ) : (
                      user.fullName
                    )}
                  </td>
                  <td>
                    {isEditing === user.id ? (
                      <input
                        type="text"
                        name="phoneNumber"
                        value={editData.phoneNumber}
                        onChange={handleInputChange}
                      />
                    ) : (
                      user.phoneNumber
                    )}
                  </td>
                  <td>
                    {isEditing === user.id ? (
                      <input
                        type="email"
                        name="email"
                        value={editData.email}
                        onChange={handleInputChange}
                      />
                    ) : (
                      user.email
                    )}
                  </td>
                  <td>{user.gymMembershipId}</td>
                  <td>
                    {isEditing === user.id ? (
                      <input
                        type="text"
                        name="package"
                        value={editData.package}
                        onChange={handleInputChange}
                      />
                    ) : (
                      user.subscriptionPackage
                    )}
                  </td>
                  <td>
                    {isEditing === user.id ? (
                      <input
                        type="text"
                        name="membershipStatus"
                        value={editData.membershipStatus}
                        onChange={handleInputChange}
                      />
                    ) : (
                      user.membershipStatus
                    )}
                  </td>
                  <td>
                    {isEditing === user.id ? (
                      <input
                        type="date"
                        name="dateOfRegistration"
                        value={editData.dateOfRegistration}
                        onChange={handleInputChange}
                      />
                    ) : (
                      user.dateOfRegistration
                    )}
                  </td>
                  <td>
                    {isEditing === user.id ? (
                      <input
                        type="date"
                        name="endDate"
                        value={editData.endDate}
                        onChange={handleInputChange}
                      />
                    ) : (
                      user.endDate || 'N/A'
                    )}
                  </td>
                  <td>
                    {isEditing === user.id ? (
                      <input type="file" onChange={handleProfilePicChangeEdit} />
                    ) : (
                      <img src={user.profilePicture} alt={`${user.fullName}'s profile`} className="profile_pic" />
                    )}
                  </td>
                  <td>
                    {isEditing === user.id ? (
                      <>
                        <button onClick={handleSaveClick}>Save</button>
                        <button onClick={handleCancelClick}>Cancel</button>
                      </>
                    ) : (
                      <>
                        <button onClick={() => handleEditClick(user)}>Edit</button>
                        <button onClick={() => handleRemoveClick(user.id)}>Remove</button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default Register;
