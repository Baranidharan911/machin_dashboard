import React, { useState } from 'react';
import { Line } from 'react-chartjs-2';
import { Gauge, gaugeClasses } from '@mui/x-charts/Gauge';
import { Chart as ChartJS, CategoryScale, LinearScale, LineElement, Title, Tooltip, Legend, PointElement } from 'chart.js';
import Header from './Header'; // Import the common header
import '../styles/DashboardOverview.css';

ChartJS.register(CategoryScale, LinearScale, LineElement, Title, Tooltip, Legend, PointElement);

// Sample revenue data for each brand
const revenueData = {
    daily: {
        'Optimum': 5000,
        'Muscle Blaze': 700,
        'Avvatar': 9000,
    },
    weekly: {
        'Optimum ': 35000,
        'MUSCLE BLAZE': 4900,
        'Avvatar': 6300,
    },
    monthly: {
        'Optimum': 150000,
        'Muscle Blaze': 21000,
        'Avvatar': 270000,
    },
    yearly: {
        'Optimum': 18000,
        'Muscle Blaze': 2500000,
        'Avvatar': 32000,
    },
};

const brandsData = [
    {
        name: 'Optimum ',
        flavors: [
            { name: 'Chocolate', percentage: 25, supplementary: 'Mass Gainer', count: 200 },
            { name: 'Strawberry', percentage: 40, supplementary: 'Whey', count: 150 },
            { name: 'Vanilla', percentage: 75, supplementary: 'Whey', count: 50 },
        ],
    },
    {
        name: 'Muscle Blaze',
        flavors: [
            { name: 'Chocolate', percentage: 10, supplementary: 'Mass Gainer', count: 250 },
            { name: 'Strawberry', percentage: 60, supplementary: 'Whey', count: 100 },
            { name: 'Vanilla', percentage: 90, supplementary: 'Whey', count: 30 },
        ],
    },
    {
        name: 'Avvatar',
        flavors: [
            { name: 'Chocolate', percentage: 30, supplementary: 'Mass Gainer', count: 180 },
            { name: 'Strawberry', percentage: 50, supplementary: 'Whey', count: 120 },
            { name: 'Vanilla', percentage: 0, supplementary: 'Whey', count: 300 },
        ],
    },
];

const getColorForPercentage = (percentage) => {
    if (percentage === 0) return '#ccc'; // Plain color for 0%
    if (percentage > 0 && percentage <= 30) return '#f44336'; // Red for low percentage
    if (percentage > 30 && percentage <= 70) return '#ffeb3b'; // Yellow for mid percentage
    if (percentage > 70) return '#4caf50'; // Green for high percentage
};

const DashboardOverview = () => {
    const [selectedFilter, setSelectedFilter] = useState('daily');

    const handleFilterChange = (event) => {
        setSelectedFilter(event.target.value);
    };

    // Prepare the data for the area chart based on the selected filter
    const chartData = {
        labels: Object.keys(revenueData[selectedFilter]),
        datasets: [
            {
                label: 'Revenue',
                data: Object.values(revenueData[selectedFilter]),
                backgroundColor: 'rgba(148, 0, 211, 0.2)', // Violet gradient background
                borderColor: 'rgba(148, 0, 211, 1)', // Solid violet line
                pointBackgroundColor: 'rgba(148, 0, 211, 1)', // Violet points
                fill: true, // Enable the fill for area chart
                tension: 0.4, // Smooth curves
            },
        ],
    };

    const chartOptions = {
        plugins: {
            legend: {
                display: true,
                position: 'bottom',
            },
            title: {
                display: false,
            },
        },
        scales: {
            y: {
                beginAtZero: true,
                ticks: {
                    callback: function(value) {
                        return '₹' + value;
                    }
                }
            },
            x: {
                beginAtZero: true,
            },
        },
    };

    // Flatten the data to create a list of all products, sorting by lowest remaining level (percentage)
    const allProducts = brandsData.flatMap(brand =>
        brand.flavors.map(flavor => ({
            brandName: brand.name,
            flavorName: flavor.name,
            supplementary: flavor.supplementary,
            count: flavor.count,
            percentage: flavor.percentage, // Sort by percentage, lower means more sold
        }))
    ).sort((a, b) => a.percentage - b.percentage) // Sort in ascending order of percentage
    .slice(0, 5); // Get only the top 5 best-selling products

    return (
        <div className="dashboard-container">
            <Header /> {/* Include the common header */}
            <h2>Dashboard Overview</h2>
            <div className="brands-flavors-section">
                {brandsData.map((brand, index) => (
                    <div key={index} className="brand-section">
                        <h3>{brand.name}</h3>
                        <div className="flavors-container">
                            {brand.flavors.map((flavor, idx) => (
                                <div key={idx} className="flavor-item">
                                    <div className="flavor-name">{flavor.name}</div>
                                    <Gauge
                                        width={80} // 70% of 200px
                                        height={80} // 70% of 200px
                                        value={flavor.percentage}
                                        cornerRadius="50%"
                                        sx={(theme) => ({
                                            [`& .${gaugeClasses.valueText}`]: {
                                                fontSize: 20,
                                            },
                                            [`& .${gaugeClasses.valueArc}`]: {
                                                fill: getColorForPercentage(flavor.percentage),
                                            },
                                            [`& .${gaugeClasses.referenceArc}`]: {
                                                fill: theme.palette.text.disabled,
                                            },
                                        })}
                                    />
                                    <div className="supplementary-name">{flavor.supplementary}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>

            <div className="dashboard-metrics">
                <div className="revenue-section">
                    <h3>Revenue</h3>
                    <div className="filter-section">
                        <label htmlFor="revenue-filter">View by:</label>
                        <select id="revenue-filter" value={selectedFilter} onChange={handleFilterChange}>
                            <option value="daily">Daily</option>
                            <option value="weekly">Weekly</option>
                            <option value="monthly">Monthly</option>
                            <option value="yearly">Yearly</option>
                        </select>
                    </div>
                    <Line data={chartData} options={chartOptions} />
                </div>
                <div className="top-selling-products">
                    <h3>Top 5 Best Selling Products</h3>
                    <table>
                        <thead>
                            <tr>
                                <th>No</th>
                                <th>Brand Name</th>
                                <th>Count</th>
                                <th>Flavor</th>
                                <th>Supplement</th>
                            </tr>
                        </thead>
                        <tbody>
                            {allProducts.map((product, index) => (
                                <tr key={index}>
                                    <td>{index + 1}</td>
                                    <td>{product.brandName}</td>
                                    <td>{product.count}</td>
                                    <td>{product.flavorName}</td>
                                    <td>{product.supplementary}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default DashboardOverview;
