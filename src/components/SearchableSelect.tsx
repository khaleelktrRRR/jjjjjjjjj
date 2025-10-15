import React from 'react';
import Select from 'react-select/async';
import { supabase } from '../lib/supabase';

interface SearchableSelectProps {
  value: any;
  onChange: (value: any) => void;
  placeholder: string;
  tableName: 'books' | 'members';
  labelField: string;
  searchFields: string[];
  required?: boolean;
  onlyAvailableBooks?: boolean;
}

const SearchableSelect: React.FC<SearchableSelectProps> = ({
  value,
  onChange,
  placeholder,
  tableName,
  labelField,
  searchFields,
  required,
  onlyAvailableBooks,
}) => {
  const loadOptions = async (inputValue: string) => {
    let query = supabase.from(tableName).select('*');

    if (inputValue) {
      const searchFilters = searchFields.map(field => `${field}.ilike.%${inputValue}%`).join(',');
      query = query.or(searchFilters);
    }

    if (tableName === 'books' && onlyAvailableBooks) {
      query = query.gt('available_copies', 0);
    }

    const { data, error } = await query.limit(20);

    if (error) {
      console.error(`Error fetching ${tableName}:`, error);
      return [];
    }

    return data.map(item => ({
      value: item.id,
      label: item[labelField],
      data: item
    }));
  };

  return (
    <Select
      cacheOptions
      defaultOptions
      value={value}
      onChange={onChange}
      loadOptions={loadOptions}
      isClearable
      placeholder={placeholder}
      required={required}
      noOptionsMessage={({ inputValue }) =>
        !inputValue ? 'No options available' : 'No results found'
      }
      loadingMessage={() => 'Searching...'}
      styles={{
        control: (base) => ({
          ...base,
          borderColor: '#d1d5db',
          '&:hover': { borderColor: '#a5b4fc' },
          boxShadow: 'none',
        }),
        option: (base, { isFocused, isSelected }) => ({
          ...base,
          backgroundColor: isSelected ? '#8b5cf6' : isFocused ? '#ede9fe' : undefined,
          color: isSelected ? 'white' : 'black',
        }),
      }}
    />
  );
};

export default SearchableSelect;
