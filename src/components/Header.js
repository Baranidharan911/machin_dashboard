import React from 'react';
import { CgProfile } from 'react-icons/cg';
import '../styles/Header.css';
import logoicon from '../assets/logo.png';

const Header = () => {
    return (
        <div className="header">
            <div className="header-left">
                <img src={logoicon} alt="logo" className="logo-icon" />
            </div>
            <div className="header-right">
                <div className="admin-profile">
                    <div className="admin">
                        Admin
                    </div>
                    <div className="profile-icon">
                        <CgProfile size={30} />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Header;
