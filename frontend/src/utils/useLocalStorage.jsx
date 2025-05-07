import { useState } from 'react';

function useLocalStorage(key, defaultValue) {
  let startingValue;
  const storedValue = localStorage.getItem(key);

  if (storedValue !== null && storedValue !== undefined) {
    startingValue = JSON.parse(storedValue);
  } else {
    startingValue = defaultValue;
  }

  const [value, setReactValue] = useState(startingValue);

  const setValue = (newValue) => {
    setReactValue(newValue);
    localStorage.setItem(key, JSON.stringify(newValue));
  }

  return [value, setValue];
}
  
export { useLocalStorage };