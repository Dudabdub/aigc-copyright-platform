import React, { useState } from 'react';
import Home from './components/Home';
import FeaturePage from './components/FeaturePage';
import { useWallet } from './hooks/useWallet';
import './App.css';

function App() {
    const wallet = useWallet();
    const [currentPage, setCurrentPage] = useState('home'); // 'home' | 'upload' | 'detect' | 'certificate'
    const [agreementSigned, setAgreementSigned] = useState(false);
    const [lastCopyright, setLastCopyright] = useState(null);

    const goHome = () => setCurrentPage('home');

    if (currentPage === 'home') {
        return <Home wallet={wallet} onNavigate={(page) => setCurrentPage(page)} />;
    }

    return (
        <FeaturePage
            currentPage={currentPage}
            goHome={goHome}
            wallet={wallet}
            agreementSigned={agreementSigned}
            onSigned={() => setAgreementSigned(true)}
            lastCopyright={lastCopyright}
            onRegistered={(data) => {
                setLastCopyright(data);
                setCurrentPage('certificate');
            }}
        />
    );
}

export default App;