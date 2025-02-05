import { FC } from 'react';
import styles from '../styles/Home.module.css';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { useRouter } from 'next/router';

export const AppBar: FC = () => {
    
    const router = useRouter();

    const navigateTo = (path: string) => {
        router.push(path);
      };

      
    return (
        <div className={styles.AppHeader}>
            <div className={styles.LeftSection}>
                <img src="/BarsukNewPNG.png" className={styles.LogoImage}/>
                <span style={{ fontWeight: 'bold' }}>DOMINATORS</span>
                <button className={styles.NavButton} onClick={() => navigateTo('/office')}>OFFICE</button>
            </div>
            <div className={styles.RightSection}>
                <WalletMultiButton/>
            </div>
        </div>
    );
};
