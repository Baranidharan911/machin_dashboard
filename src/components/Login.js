// src/components/Login.js
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { auth, db } from '../firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import '../styles/login.css'; // Import the new Login CSS

function Login() {
  const { register, handleSubmit, formState: { errors } } = useForm();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const onSubmit = async (data) => {
    try {
      setLoading(true);
      const userCredential = await signInWithEmailAndPassword(auth, data.email, data.password);
      const user = userCredential.user;

      const docRef = doc(db, 'Users', user.uid);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const userRole = docSnap.data().role;

        if (userRole === 'admin') {
          alert('Login successful!');
          navigate('/register'); // Navigate to the registration page after successful login
        } else {
          alert('You are not authorized to access this page.');
          navigate('/login');
        }
      } else {
        alert('No such user exists!');
      }
    } catch (error) {
      console.error('Error logging in: ', error);
      alert('Error logging in. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="form_wrapper">
      <div className="form_container">
        <div className="title_container">
          <h2>Login Page</h2>
        </div>
        <div className="row clearfix">
          <div className="">
            <form onSubmit={handleSubmit(onSubmit)}>
              <div className="input_field">
                <span><i className="fa fa-envelope" aria-hidden="true"></i></span>
                <input
                  type="email"
                  placeholder="Email"
                  {...register('email', { required: true })}
                />
                {errors.email && <span>This field is required</span>}
              </div>

              <div className="input_field">
                <span><i className="fa fa-lock" aria-hidden="true"></i></span>
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Password"
                  {...register('password', { required: true })}
                />
                <i
                  className={`fa ${showPassword ? "fa-eye-slash" : "fa-eye"} toggle_password`}
                  onClick={togglePasswordVisibility}
                  aria-hidden="true"
                ></i>
                {errors.password && <span>This field is required</span>}
              </div>

              <input className="button" type="submit" value={loading ? 'Logging in...' : 'Login'} disabled={loading} />
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;
       