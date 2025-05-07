import React from 'react';
import './styles/Shared.css';
import './styles/Transactions.css';
import { Route, Routes } from 'react-router-dom';
import { useLocalStorage } from './utils/useLocalStorage';
import { Transactions } from './components/Transactions';
import useSWR from 'swr'

function App() {
  const [chosenNav, setChosenNav] = useLocalStorage('chosenNav', []);

  // const { data: companyNames, error: companyNamesError, isLoading: companyNamesIsLoading } = useSWR('/api/get_company_names/', async () => {
  //   try {
  //     const response = await fetch(`http://localhost:8000/api/get_company_names/`, {
  //       method: "GET",
  //       cache: "no-cache",
  //       credentials: "same-origin",
  //       headers: {
  //         "Content-Type": "application/json",
  //       },
  //       redirect: "follow",
  //       referrerPolicy: "no-referrer",
  //     });

  //     if (!response.ok) {
  //       throw new Error('Network response was not ok');
  //     }

  //     const data = await response.json();
  //     return data;
  //   } catch (error) {
  //     console.error('Error fetching all companies names:', error);
  //     throw error;
  //   }
  // }, {
  //   revalidateIfStale: false,
  //   revalidateOnFocus: false,
  //   revalidateOnReconnect: false,
  //   // revalidateOnMount:false,
  //   // refreshWhenOffline: false,
  //   // refreshWhenHidden: false,
  //   // refreshInterval: 0
  // });

  // if (companyNamesError) return <div>failed to load all companies name options data</div>
  // if (companyNamesIsLoading) return <div>loading all companies name options data...</div>

  return (
    <Routes>
      <Route path="/" element={
        <Transactions
          chosenNav={chosenNav}
          setChosenNav={setChosenNav}
        // companyNames={companyNames}
        />
      } />
      <Route path="/transactions" element={
        <Transactions
          chosenNav={chosenNav}
          setChosenNav={setChosenNav}
        // companyNames={companyNames}
        />
      } />
    </Routes>
  );
}

export default App;