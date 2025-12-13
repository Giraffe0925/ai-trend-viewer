'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

const Header = () => {
    const [searchQuery, setSearchQuery] = useState('');
    const router = useRouter();

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        if (searchQuery.trim()) {
            router.push(`/?q=${encodeURIComponent(searchQuery.trim())}`);
        } else {
            router.push('/');
        }
    };

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

    const searchFormStyle: React.CSSProperties = {
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
    };

    const searchInputStyle: React.CSSProperties = {
        padding: '8px 16px',
        border: '1px solid #E5E7EB',
        borderRadius: '9999px',
        fontSize: '14px',
        width: '200px',
        outline: 'none',
        transition: 'border-color 0.2s',
    };

    const searchButtonStyle: React.CSSProperties = {
        padding: '8px 16px',
        backgroundColor: '#8BA89A',
        color: 'white',
        border: 'none',
        borderRadius: '9999px',
        fontSize: '14px',
        fontWeight: 500,
        cursor: 'pointer',
        transition: 'background-color 0.2s',
    };

    return (
        <header style={headerStyle}>
            <div style={containerStyle}>
                <Link href="/" style={logoContainerStyle}>
                    <img src="/images/logo.png" alt="Logo" style={logoImageStyle} />
                    <span style={titleStyle}>AI & Sci Trend</span>
                </Link>
                <form onSubmit={handleSearch} style={searchFormStyle}>
                    <input
                        type="text"
                        placeholder="論文を検索..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        style={searchInputStyle}
                    />
                    <button type="submit" style={searchButtonStyle}>
                        検索
                    </button>
                </form>
            </div>
        </header>
    );
};

export default Header;
