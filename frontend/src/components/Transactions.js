import React, { useState, useEffect, useRef } from 'react';
import { NavBar } from "./NavBar";
import { useNavigate, useParams } from 'react-router-dom';
import Select from 'react-select';
import { formatSmallTransactions } from '../utils/unitHelper';

export function Transactions({
    chosenNav,
    setChosenNav,
    // companyNames,
}) {
    const [transactions, setTransactions] = useState([]);
    const [transactionCompanies, setTransactionCompanies] = useState({});
    const [open, setOpen] = useState([]);
    const [totalNet, setTotalNet] = useState(0.0);
    const [csvFile, setCsvFile] = useState(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [uploadProgress, setUploadProgress] = useState('');
    const [uploadStatus, setUploadStatus] = useState(null); // 'success', 'error', or null
    const [uploadResult, setUploadResult] = useState(null);
    const fileInputRef = useRef(null);

    useEffect(() => {
        fetchLatestTransactionCompanies()
        const intervalId = setInterval(fetchLatestTransactionCompanies, 3600000);
        return () => clearInterval(intervalId);
    }, []); //TODO why does it infinitely call fetchLatestTransactions when I add transactions to this list?

    useEffect(() => {
        updateTransactionCompanies()
        const intervalId = setInterval(updateTransactionCompanies, 3600000);
        return () => clearInterval(intervalId);
    }, []);

    useEffect(() => {
        const fetchData = async () => {
            if (transactionCompanies) {
                await fetchLatestTransactions();
            }
        };
        fetchData();
    }, [transactionCompanies]);

    const toggle = (i) => {
        const copyOpen = [...open];
        copyOpen[i] = !copyOpen[i];
        setOpen(copyOpen);
    };

    const fetchLatestTransactionCompanies = async () => {
        try {
            const response = await fetch('http://localhost:8000/api/get_transaction_companies/');
            if (!response.ok) {
                throw new Error('Failed to fetch transaction companies data');
            }
            const data = await response.json();
            setTransactionCompanies(data);
        } catch (error) {
            console.error("Error fetching transaction companies:", error);
        }
    };

    const fetchLatestTransactions = async () => {
        try {
            const response = await fetch('http://localhost:8000/api/get_transactions/');
            if (!response.ok) {
                throw new Error('Failed to fetch transactions data');
            }
            const data = await response.json();
            let totalNetResult = 0.0;
            Object.entries(data).forEach(([ticker, tickerData]) => {
                const profitData = calculateProfit(tickerData);
                totalNetResult += profitData.netResult;
            });
            setTotalNet(totalNetResult);
            setTransactions(data);
        } catch (error) {
            console.error('Error fetching transaction data:', error);
        }
    };

    const customStyles = {
        option: (provided, state) => ({
            ...provided,
            color: state.data.category === 'sp500' ? 'black' : 'lightblue',
        }),
    };

    const filterOption = (candidate, input) => {
        if (!input) return false;

        const { label } = candidate.data;
        const uppercaseInput = input.toUpperCase();

        return label.toUpperCase().startsWith(uppercaseInput);
    };

    const updateTransactionCompanies = async () => {
        try {
            const url = `http://localhost:8000/api/update_transactions_companies/`;
            const response = await fetch(url, {
                method: 'PUT',
            });
            if (!response.ok) {
                throw new Error('Failed to update transaction companies');
            }
        } catch (error) {
            console.error("error: ", error);
        }
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        // await addTransactions();
        await fetchLatestTransactions();
        await updateTransactionCompanies();
    };

    const handleDelete = (transaction_id) => {
        fetch(`http://localhost:8000/api/delete_transaction/?transaction_id=${transaction_id}`, {
            method: 'DELETE'
        })
            .then(response => {
                if (!response.ok) {
                    throw new Error('Failed to delete a transaction from transactions list');
                }
                return response.json();
            })
            .then(data => {
                fetchLatestTransactions();
            })
            .catch(error => {
                console.error('Error deleting a transaction from transactions list:', error);
            });
    };

    const handleFileChange = (e) => {
        setCsvFile(e.target.files[0]);
    };

    const parseCsvFile = (file) => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (event) => {
                const csvText = event.target.result;
                const lines = csvText.split('\n');
                const originalHeaders = lines[0].split(',').map(header => header.trim());
                const headers = originalHeaders.map(header => header.toLowerCase());

                // Map CSV columns to our transaction fields
                const dateIndex = headers.findIndex(h => h.toLowerCase().includes("date"));
                const actionIndex = headers.findIndex(h => h.toLowerCase().includes("action"));
                const symbolIndex = headers.findIndex(h => h.toLowerCase().includes("symbol"));
                const quantityIndex = headers.findIndex(h => h.toLowerCase().includes("quantity"));
                const priceIndex = headers.findIndex(h => h.toLowerCase().includes("price"));
                const feesIndex = headers.findIndex(h => h.toLowerCase().includes("fees & comm"));
                const amountIndex = headers.findIndex(h => h.toLowerCase().includes("amount"))

                if (dateIndex === -1 || actionIndex === -1 || symbolIndex === -1 ||
                    quantityIndex === -1 || priceIndex === -1 || feesIndex === -1 || amountIndex === -1) {
                    reject('CSV format is invalid. Required columns: Date, Action, Symbol, Quantity, Price, Fees & Comm, Amount');
                    return;
                }

                const transactions = [];

                // Skip header row
                for (let i = 1; i < lines.length; i++) {
                    if (!lines[i].trim()) continue; // Skip empty lines

                    const values = lines[i].split(',').map(val => val.trim());

                    // Format date (MM/DD/YYYY)
                    let dateStr = values[dateIndex].replace(/"/g, '');
                    let formattedDate = dateStr;

                    // Handle MM/DD/YYYY format
                    if (dateStr.includes('/')) {
                        const dateParts = dateStr.split('/');
                        if (dateParts.length === 3) {
                            formattedDate = `${dateParts[2]}-${dateParts[0].padStart(2, '0')}-${dateParts[1].padStart(2, '0')}`;
                        }
                    }

                    // Make sure there are no double quotes or extra hyphens
                    formattedDate = formattedDate.replace(/"/g, '').replace(/-{2,}/g, '-');

                    // Action type = "Buy", "Sell", "Qualified Dividend", "Reinvest Shares"
                    let actionType = values[actionIndex].toLowerCase();
                    if (actionType.includes('buy')) {
                        actionType = 'buy';
                    } else if (actionType.includes('sell')) {
                        actionType = 'sell';
                    } else if (actionType.includes("qualified dividend")) {
                        actionType = 'qualified_dividend';
                    } else if (actionType.includes("reinvest shares")) {
                        actionType = 'reinvest_shares';
                    } else {
                        continue
                    }

                    // Clean up the quantity string by removing non-numeric characters except for decimal point
                    const cleanQuantity = values[quantityIndex].replace(/[^\d.-]/g, '');
                    const cleanPrice = values[priceIndex].replace(/[^\d.-]/g, '');
                    const cleanFee = (values[feesIndex] || '0').replace(/[^\d.-]/g, '');
                    const cleanAmount = (values[amountIndex] || '0').replace(/[^\d.-]/g, '');

                    // Remove any quotes from ticker symbol
                    const cleanTicker = values[symbolIndex].replace(/"/g, '');

                    // Parse numbers
                    const quantity = parseFloat(cleanQuantity) || 0;
                    const price = parseFloat(cleanPrice) || 0;
                    const fee = parseFloat(cleanFee) || 0;
                    const amount = parseFloat(cleanAmount) || 0;

                    // Create object for this transaction
                    const transactionObj = {
                        date: formattedDate,
                        action: actionType,
                        ticker: cleanTicker,
                        quantity: quantity,
                        price: price,
                        fee: fee,
                        amount: amount
                    };

                    // For dividend or other types where quantity might be null
                    if (actionType === 'qualified_dividend' || actionType === 'reinvest_shares') {
                        if (isNaN(quantity)) {
                            transactionObj.quantity = null;
                        }
                        if (isNaN(price)) {
                            transactionObj.price = null;
                        }
                    }

                    transactions.push(transactionObj);
                }

                resolve(transactions);
            };

            reader.onerror = (error) => {
                reject(error);
            };

            reader.readAsText(file);
        });
    };

    const uploadBulkTransactions = async (transactions) => {
        try {
            const response = await fetch('http://localhost:8000/api/bulk_add_transactions/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ transactions }),
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.message || 'Failed to upload transactions');
            }

            return result;
        } catch (error) {
            console.error('Error uploading transactions:', error);
            throw error;
        }
    };

    const handleCsvUpload = async () => {
        if (!csvFile) {
            setUploadStatus('error');
            setUploadProgress('Please select a CSV file first');
            return;
        }

        // Reset progress indicators
        setIsProcessing(true);
        setUploadStatus(null);
        setUploadProgress('Parsing CSV file...');
        setUploadResult(null);

        try {
            // Parse CSV file
            const transactions = await parseCsvFile(csvFile);
            console.log('Parsed transactions:', transactions);

            if (transactions.length === 0) {
                setUploadStatus('error');
                setUploadProgress('No transactions found in the CSV file');
                return;
            }

            setUploadProgress(`Uploading ${transactions.length} transactions...`);

            // Upload transactions to backend
            const result = await uploadBulkTransactions(transactions);
            setUploadResult(result);

            // Reset file input
            setCsvFile(null);
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }

            // Show success message
            setUploadStatus('success');
            setUploadProgress(`Upload complete: Added ${result.success_count} transactions${result.error_count > 0 ? `, Failed: ${result.error_count}` : ''
                }`);

            // Refresh transactions list
            setUploadProgress('Refreshing transaction list...');
            await fetchLatestTransactions();
            await updateTransactionCompanies();

            setUploadProgress('Upload complete!');

        } catch (error) {
            console.error('Error processing CSV:', error);
            setUploadStatus('error');
            setUploadProgress(`Error: ${error.message || error}`);
        } finally {
            setIsProcessing(false);
        }
    };

    const calculateProfit = (tickerData) => {
        let totalBought = 0.0;
        let totalSold = 0.0;
        let numSharesBought = 0.0;
        let numSharesSold = 0.0;
        let numSharesKeep = 0.0

        tickerData.map((tickerDataItem) => {
            if (tickerDataItem.transaction_type === 'buy') {
                totalBought += (tickerDataItem.transaction_price * tickerDataItem.transaction_quantity);
                numSharesBought += tickerDataItem.transaction_quantity;
            } else if (tickerDataItem.transaction_type === 'sell') {
                totalSold += ((tickerDataItem.transaction_price * tickerDataItem.transaction_quantity) - tickerDataItem.fee);
                numSharesSold += tickerDataItem.transaction_quantity;
            }
        });

        if (numSharesBought > numSharesSold) {
            // it means that I haven't sold all of them yet
            numSharesKeep = (numSharesBought - numSharesSold);
        }

        let currentPrice = parseFloat(transactionCompanies[tickerData[0].ticker]?.current_price);
        if (isNaN(currentPrice)) {
            currentPrice = 0.0;
        }

        return {
            'netResult': (totalSold + parseFloat(numSharesKeep * currentPrice)) - totalBought,
            'numSharesKeep': numSharesKeep,
            'totalKeep': parseFloat(numSharesKeep * currentPrice),
            'numSharesBought': numSharesBought,
            'totalBought': totalBought,
            'numSharesSold': numSharesSold,
            'totalSold': totalSold,
            'currentPrice': currentPrice
        }
    }

    return (
        <div className='transactions-page'>
            <div className='nav-header'>
                <img src="/lapis.png" alt="lapis" className='logo-image' />
                Lapis Investment
                <NavBar
                    chosenNav={chosenNav}
                    setChosenNav={setChosenNav}
                />
            </div>
            <div className='transactions-input'>
                <div className='csv-upload-section'>
                    <h3>Upload CSV File</h3>
                    <p>CSV must include: Date, Action, Symbol, Quantity, Price, Fees & Comm</p>
                    <div className='csv-upload-controls'>
                        <input
                            type="file"
                            accept=".csv"
                            onChange={handleFileChange}
                            ref={fileInputRef}
                            disabled={isProcessing}
                        />
                        <button
                            onClick={handleCsvUpload}
                            disabled={!csvFile || isProcessing}
                            className="csv-upload-button"
                        >
                            {isProcessing ? 'Processing...' : 'Upload CSV'}
                        </button>
                    </div>

                    {uploadProgress && (
                        <div className={`upload-progress ${uploadStatus ? `upload-${uploadStatus}` : ''}`}>
                            <p>{uploadProgress}</p>

                            {uploadStatus === 'success' && uploadResult && uploadResult.error_count > 0 && (
                                <div className="upload-errors">
                                    <p>Errors:</p>
                                    <ul>
                                        {uploadResult.errors.map((error, index) => (
                                            <li key={index}>{error}</li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
            <div className='net-profit-text'>Net Profit:
                <span style={{ fontWeight: 'bold', color: totalNet > 0 ? 'green' : 'red' }}> ${formatSmallTransactions(totalNet)}</span>
            </div>
            <div>
                {Object.entries(transactions).map(([ticker, tickerData], index) => {
                    const profitData = calculateProfit(tickerData);
                    return (
                        <div key={ticker} className='transactions-container'>
                            <h2
                                onClick={() => toggle(index)}
                                className='ticker-name'
                            >
                                {ticker}
                            </h2>
                            <div className={`transaction-items-table ${open[index] ? 'open' : ''}`}>
                                {open[index] && (
                                    <table>
                                        <tbody>
                                            <tr>
                                                <td className='transaction-header'>Date</td>
                                                <td className='transaction-header'>Type</td>
                                                <td className='transaction-header'>Price</td>
                                                <td className='transaction-header'>Quantity</td>
                                                <td className='transaction-header'>Fee</td>
                                                <td className='transaction-header'>Total</td>
                                                <td className='transaction-header'>Gain</td>
                                            </tr>
                                            {tickerData
                                                .slice()
                                                .sort((a, b) => {
                                                    const dateA = a.transaction_date.slice(0, 10);
                                                    const dateB = b.transaction_date.slice(0, 10);
                                                    return dateB.localeCompare(dateA);
                                                })
                                                .map((transaction, idx) => {
                                                    const profitLoss = transaction.transaction_type === 'sell'
                                                        ? (transaction.transaction_price * transaction.transaction_quantity) - (profitData.currentPrice * transaction.transaction_quantity)
                                                        : (profitData.currentPrice * transaction.transaction_quantity) - (transaction.transaction_price * transaction.transaction_quantity);
                                                    const profitLossColor = profitLoss > 0 ? 'green' : 'red';

                                                    return (
                                                        <tr key={idx} style={{ backgroundColor: transaction.transaction_type === 'buy' ? '#FFE9C0' : '#D6F9F6' }}>
                                                            <td className='fixed-column-transaction'>
                                                                <div className="delete-click">
                                                                    <button onClick={() => handleDelete(transaction.transaction_id)} className="dropbtn">x</button>
                                                                </div>
                                                                {transaction.transaction_date.slice(0, 10)}
                                                            </td>
                                                            <td>{transaction.transaction_type}</td>
                                                            <td>${formatSmallTransactions(transaction.transaction_price)}</td>
                                                            <td>{transaction.transaction_quantity}</td>
                                                            <td>${formatSmallTransactions(transaction.fee)}</td>
                                                            <td>${formatSmallTransactions((transaction.transaction_price * transaction.transaction_quantity) - transaction.fee)}</td>
                                                            <td style={{ color: profitLossColor }}>
                                                                ${formatSmallTransactions(profitLoss)}
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                        </tbody>
                                    </table>
                                )}
                            </div>
                            <div className='transaction-result-container'>
                                <table className='transaction-result-table'>
                                    <tbody>
                                        <tr>
                                            <td className="transaction-result">Current</td>
                                            <td className="transaction-result">Keep</td>
                                            <td className="transaction-result">Bought</td>
                                            <td className="transaction-result">Sold</td>
                                            <td className="transaction-result">Net</td>
                                        </tr>
                                        <tr>
                                            <td>${formatSmallTransactions(profitData.currentPrice)}</td>
                                            <td>${formatSmallTransactions(profitData.totalKeep)}({profitData.numSharesKeep})</td>
                                            <td>${formatSmallTransactions(profitData.totalBought)}({profitData.numSharesBought})</td>
                                            <td>${formatSmallTransactions(profitData.totalSold)}({profitData.numSharesSold})</td>
                                            <td className={`transaction-result ${profitData.netResult > 0 ? 'profit-green' : 'profit-red'}`}>
                                                ${formatSmallTransactions(profitData.netResult)}</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )
                }
                )}
            </div>
        </div>
    );
}