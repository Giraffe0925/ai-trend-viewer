import React from 'react';
import Link from 'next/link';

const Header = () => {
    const headerStyle: React.CSSProperties = {
        position: 'sticky',
        top: 0,
        zIndex: 50,
        borderBottom: '1px solid rgba(0, 0, 0, 0.08)',
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(8px)',
    };

    const containerStyle: React.CSSProperties = {
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '0 16px',
        height: '64px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
    };

    const logoContainerStyle: React.CSSProperties = {
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        textDecoration: 'none',
        color: 'inherit',
    };

    const logoImageStyle: React.CSSProperties = {
        width: '40px',
        height: '40px',
        borderRadius: '8px',
        objectFit: 'cover',
    };

    const titleStyle: React.CSSProperties = {
        fontSize: '20px',
        fontWeight: 'bold',
        color: '#8BA89A',
        letterSpacing: '-0.02em',
    };

    const navStyle: React.CSSProperties = {
        display: 'flex',
        gap: '24px',
        fontSize: '14px',
        fontWeight: 500,
    };

    const navLinkStyle: React.CSSProperties = {
        color: '#6B7280',
        textDecoration: 'none',
        transition: 'color 0.2s',
    };

    return (
        <header style={headerStyle}>
            <div style={containerStyle}>
                <Link href="/" style={logoContainerStyle}>
                    <img src="/images/logo.png" alt="Logo" style={logoImageStyle} />
                    <span style={titleStyle}>AI & Sci Trend</span>
                </Link>
                <nav style={navStyle}>
                    <Link href="/?cat=AI" style={navLinkStyle}>AI</Link>
                    <Link href="/?cat=Science" style={navLinkStyle}>Science</Link>
                    <Link href="/?cat=Philosophy" style={navLinkStyle}>Philosophy</Link>
                </nav>
            </div>
        </header>
    );
};

export default Header;
