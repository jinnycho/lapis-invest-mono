import React, { useState, useEffect } from 'react';
import { NavBar } from "./NavBar";
import { useNavigate, useParams } from 'react-router-dom';
import Select from 'react-select';
import { formatSmallTransactions } from '../utils/unitHelper';

export function Transactions({
    chosenNav,
    setChosenNav,
    // companyNames,
}) {
    const [ticker, setTicker] = useState('');
    const [action, setAction] = useState('buy');
    const [amount, setAmount] = useState('');
    const [price, setPrice] = useState('');
    const [fee, setFee] = useState('');
    const [defaultDate, setDefaultDate] = useState(getTodayDate());
    const [transactions, setTransactions] = useState([]);
    const [transactionCompanies, setTransactionCompanies] = useState({});
    const [open, setOpen] = useState([]);
    const [totalNet, setTotalNet] = useState(0.0);

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

    function getTodayDate() {
        const today = new Date();
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, '0'); // January is 0
        const day = String(today.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

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

    const addTransactions = async () => {
        try {
            if (fee === '') {
                setFee(0.0);
            }
            const url = `http://localhost:8000/api/add_transactions/?action=${action}&ticker=${ticker}&amount=${amount}&price=${price}&fee=${fee}&transaction_time=${defaultDate}`;
            const response = await fetch(url, {
                method: 'PUT',
            });
            if (!response.ok) {
                throw new Error('Failed to add transactions');
            }
            setTicker('');
            setAction('buy');
            setAmount('');
            setPrice('');
            setFee('');
            setDefaultDate(getTodayDate());
            await fetchLatestTransactions();
        } catch (error) {
            console.error("error: ", error);
        }
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
        await addTransactions();
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

    const handleActionChange = (e) => {
        setAction(e.target.value);
    };

    const calculateProfit = (tickerData) => {
        let totalBought = 0.0;
        let totalSold = 0.0;
        let numSharesBought = 0.0;
        let numSharesSold = 0.0;
        let numSharesKeep = 0.0

        tickerData.map((tickerDataItem) => {
            if (tickerDataItem.transaction_type === 'buy') {
                totalBought += (tickerDataItem.transaction_price * tickerDataItem.transaction_amount);
                numSharesBought += tickerDataItem.transaction_amount;
            } else if (tickerDataItem.transaction_type === 'sell') {
                totalSold += ((tickerDataItem.transaction_price * tickerDataItem.transaction_amount) - tickerDataItem.fee);
                numSharesSold += tickerDataItem.transaction_amount;
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
                <form onSubmit={handleSubmit}>
                    <label htmlFor="ticker">Add:</label>
                    <Select
                        value={{ label: ticker, value: ticker }}
                        // options={companyNames}
                        className='transaction-input-select'
                        filterOption={filterOption}
                        onChange={({ value }) => setTicker(value)}
                        isSearchable={true}
                        placeholder="Select or search for a stock ticker"
                        styles={customStyles}
                    />
                    <input
                        type="date"
                        id="transaction_time"
                        name="transaction_time"
                        value={defaultDate}
                        min="1970-01-01"
                        max="9999-12-31"
                        pattern="\d{4}-\d{2}-\d{2}"
                        required
                        onChange={(e) => setDefaultDate(e.target.value)}
                    />
                    <select
                        id="transaction_type"
                        name="transaction_type"
                        value={action}
                        onChange={handleActionChange}
                    >
                        <option value="buy">Buy</option>
                        <option value="sell">Sell</option>
                    </select>
                    <input
                        type="number"
                        id="price"
                        name="price"
                        placeholder="Price"
                        value={price}
                        onChange={e => setPrice(e.target.value)}
                        required
                    />
                    <input
                        type="number"
                        id="amount"
                        name="amount"
                        placeholder="Amount"
                        value={amount}
                        onChange={e => setAmount(e.target.value)}
                        required
                    />
                    <input
                        type="text"
                        id="fee"
                        name="fee"
                        placeholder="Fee"
                        value={fee}
                        onChange={e => setFee(e.target.value)}
                    />
                    <button
                        className="transaction-submit"
                        type="submit">Submit</button>
                </form>
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
                                                <td className='transaction-header'>Amount</td>
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
                                                        ? (transaction.transaction_price * transaction.transaction_amount) - (profitData.currentPrice * transaction.transaction_amount)
                                                        : (profitData.currentPrice * transaction.transaction_amount) - (transaction.transaction_price * transaction.transaction_amount);
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
                                                            <td>{transaction.transaction_amount}</td>
                                                            <td>${formatSmallTransactions(transaction.fee)}</td>
                                                            <td>${formatSmallTransactions((transaction.transaction_price * transaction.transaction_amount) - transaction.fee)}</td>
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