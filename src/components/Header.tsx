'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

const Header = () => {
    const [searchQuery, setSearchQuery] = useState('');
    const [showSearch, setShowSearch] = useState(false);
    const router = useRouter();

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        if (searchQuery.trim()) {
            router.push(`/?q=${encodeURIComponent(searchQuery.trim())}`);
        } else {
            router.push('/');
        }
        setShowSearch(false);
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
        padding: '12px 16px',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
    };

    const topRowStyle: React.CSSProperties = {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
    };

    const logoContainerStyle: React.CSSProperties = {
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        textDecoration: 'none',
        color: 'inherit',
    };

    const logoImageStyle: React.CSSProperties = {
        width: '32px',
        height: '32px',
        borderRadius: '6px',
        objectFit: 'cover',
    };

    const titleStyle: React.CSSProperties = {
        fontSize: '16px',
        fontWeight: 'bold',
        color: '#4A5568',
        letterSpacing: '0.05em',
    };

    const searchToggleStyle: React.CSSProperties = {
        padding: '8px 12px',
        backgroundColor: '#F3F4F6',
        border: 'none',
        borderRadius: '9999px',
        fontSize: '14px',
        color: '#6B7280',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: '4px',
    };

    const searchFormStyle: React.CSSProperties = {
        display: showSearch ? 'flex' : 'none',
        alignItems: 'center',
        gap: '8px',
        width: '100%',
    };

    const searchInputStyle: React.CSSProperties = {
        flex: 1,
        padding: '10px 16px',
        border: '1px solid #E5E7EB',
        borderRadius: '9999px',
        fontSize: '14px',
        outline: 'none',
    };

    const searchButtonStyle: React.CSSProperties = {
        padding: '10px 20px',
        backgroundColor: '#8BA89A',
        color: 'white',
        border: 'none',
        borderRadius: '9999px',
        fontSize: '14px',
        fontWeight: 500,
        cursor: 'pointer',
        flexShrink: 0,
    };

    return (
        <header style={headerStyle}>
            <div style={containerStyle}>
                <div style={topRowStyle}>
                    <Link href="/" style={logoContainerStyle}>
                        <img src="/images/logo.png" alt="Logo" style={logoImageStyle} />
                        <span style={titleStyle}>日々知読</span>
                    </Link>
                    <button
                        type="button"
                        onClick={() => setShowSearch(!showSearch)}
                        style={searchToggleStyle}
                    >
                        🔍 検索
                    </button>
                </div>
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
