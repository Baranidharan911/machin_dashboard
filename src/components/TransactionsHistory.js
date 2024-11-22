import React, { useState, useEffect } from 'react';
import { PieChart } from '@mui/x-charts/PieChart';
import { db } from '../firebase'; // Make sure the correct relative path is used
import { collection, getDocs } from 'firebase/firestore';
import '../styles/TransactionsHistory.css'; // Adjust path if needed

export default function TransactionsHistory() {
  const [transactions, setTransactions] = useState([]);
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalTransactions, setTotalTransactions] = useState(0);

  useEffect(() => {
    async function fetchData() {
      try {
        const querySnapshot = await getDocs(collection(db, "payments"));
        let data = [];
        let successCount = 0;
        let failedCount = 0;

        querySnapshot.forEach((doc) => {
          const transaction = doc.data();
          data.push(transaction);
          if (transaction.status === "success") {
            successCount++;
          } else if (transaction.status === "failed") {
            failedCount++;
          }
        });

        const total = successCount + failedCount;
        setTotalTransactions(total); // Store total number of transactions

        setTransactions(data);
        setChartData([
          { id: 'Success', label: 'Success', value: successCount, color: 'green' },
          { id: 'Failed', label: 'Failed', value: failedCount, color: 'red' },
        ]);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching transactions: ", error);
      }
    }

    fetchData();
  }, []);

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="transaction-history">
      {/* Pie Chart Section */}
      <div className="pie-chart-div">
        <h2>Transaction Status Overview</h2>
        <PieChart
          series={[
            {
              data: chartData,
              highlightScope: { fade: 'global', highlight: 'item' },
              faded: { innerRadius: 30, additionalRadius: -30, color: 'gray' },
              valueFormatter: (value) => `${value} transactions`,
              label: {
                visible: true, // Ensures the label is visible
                align: 'center',
                formatter: ({ data }) => `${data.label}`, // Display 'Success' or 'Failed' in the center
                style: ({ data }) => ({
                  fill: data.color, // Color based on the transaction status
                  fontWeight: 'bold',
                  textShadow: '0px 0px 5px rgba(255, 255, 255, 0.8)', // Light shining effect
                }),
              },
              tooltip: {
                formatter: ({ data }) => {
                  const percentage = ((data.value / totalTransactions) * 100).toFixed(2); // Calculate percentage
                  return `${data.label}: ${data.value} transactions (${percentage}%)`; // Tooltip with percentage
                },
              },
            },
          ]}
          height={200}
        />
      </div>

      {/* Cards Section */}
      <div className="cards-div">
        {transactions.map((transaction, index) => (
          <div key={index} className={`transaction-card transaction-card-${index % 5}`}>
            <p><strong>Amount:</strong> {transaction.amount}</p>
            <p><strong>Payment ID:</strong> {transaction.payment_id}</p>
            <p><strong>Status:</strong> <b>{transaction.status}</b></p>
            <p><strong>Timestamp:</strong> {transaction.timestamp.toDate().toString()}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
