import React, { FC, useState } from "react";
import styles from "../styles/ConnectButton.module.css";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { solCommands } from '../utils/solCommands';
import { tools } from "../utils/tools";


type TeamData = {
  id: number;
  name: string;
  bank: number;
  players: number;
} | null;


type ConnectButtonProps = {
  setCheck: (value: boolean) => void; // ✅ Принимаем setCheck как пропс
};

export const ConnectButton: FC<ConnectButtonProps> = ({ setCheck }) => {

  const { connection } = useConnection();
  const { publicKey, sendTransaction } = useWallet();
  const [ status, setStatus ] = useState<String>("JOIN");

  const [value, setValue] = useState(0.01);
  const gradient = `linear-gradient(90deg, #ff9900 ${value * 100}%, #444 ${value * 100}%)`;
  
  const joinGame = async () => {
    try {
      setStatus("JOINING...")
      const { transaction, amount } = await solCommands.JoinGame(connection, publicKey, value);
  
      const signature = await sendTransaction(transaction, connection);
  
      const confirmation = await connection.confirmTransaction(signature, 'finalized');
      
      if (confirmation.value.err) {
        throw new Error('Transaction failed');
      }
  
      console.log("✅ Транзакция успешно подтверждена:", signature);

      const teamResponse = await fetch("/api/teaminfo");
      
      if (!teamResponse.ok) {
        throw new Error("❌ Ошибка при получении данных о командах");
      }
    
      const teamData = await teamResponse.json();

      if (!teamData.teams) {
        throw new Error("❌ Ошибка: Команды не найдены");
      }

      const teamA: TeamData | null = teamData.teams.find((team: TeamData) => team.id === 1)|| null;
      const teamB: TeamData | null = teamData.teams.find((team: TeamData) => team.id === 2) || null;

      if (!teamA || !teamB) {
        throw new Error("Не удалось найти команды с id 1 и 2");
      }

      const { team } = await tools.DetermineTeam(teamA.bank, teamB.bank, teamA.players, teamB.players, amount)

      const teamId: number = (() => {
        switch (team) {
          case "Team1":
            return 1;
          case "Team2":
            return 2;
          default:
            throw new Error(`❌ Ошибка: '${team}' не является допустимым названием команды`);
        }
      })(); 
  
      // Отправляем пользователя в БД
      const response = await fetch('/api/join', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          publicKey: publicKey.toBase58(),
          amount: amount,
          transactionId: signature,
          team: teamId,
        }),
      });
  
      const result = await response.json();
      if (response.ok) {
        console.log("✅ Пользователь добавлен в БД:", result);
        setStatus("JOINED")
        setCheck(true)
        
      } else {
        console.error("❌ Ошибка при добавлении в БД:", result.message);
        setStatus("JOIN")
      }
    } catch (error) {
      console.error("❌ Ошибка в joinGame:", error)
      setStatus("JOIN");
    }
  };
  
  


  return (
    <div className={styles.container}>
      {/* Ползунок (Slider) */}
      <input
        type="range"
        min="0.01"
        max="5"
        step="0.01"
        value={value}
        onChange={(e) => setValue(parseFloat(e.target.value))}
        className={styles.slider}
        style={{ background: gradient }}
      />
      <span className={styles.valueLabel}>{value.toFixed(2)} SOL</span>

      {/* Кнопка JOIN */}
      <button
        className={`${styles.ConnectButton} ${status == "JOINING..." ? styles.disabled : ""} ${status == "JOINED" ? styles.finished : ""}`}
        onClick={() => joinGame()}
        disabled={status !== "JOIN"}
      >
        {status}
      </button>
    </div>
  );

};

