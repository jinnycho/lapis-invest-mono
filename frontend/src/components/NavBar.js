import React from 'react';
import { Link } from "react-router-dom";

export function NavBar({
    chosenNav,
    setChosenNav
}) {
    const handleNavClick = (navValue) => {
        setChosenNav(navValue);
    };

    return (
        <>
            <Link to={'/transactions'}
                key={'transactions'}
                className={`nav-option ${chosenNav === 'transactions' ? 'selected' : ''}`}
                onClick={() => handleNavClick('transactions')}>Transactions
            </Link>
        </>
    );
}