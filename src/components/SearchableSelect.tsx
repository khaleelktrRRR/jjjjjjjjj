import React from 'react';
import Select from 'react-select';
import { supabase } from '../lib/supabase';

interface SearchableSelectProps {
  value: any;
  onChange: (value: any) => void;
  placeholder: string;
  tableName: 'books' | 'members';
  labelField: string;
  searchFields: string[];
  required?: boolean;
}

const SearchableSelect: React.FC<SearchableSelectProps> = ({
  value,
  onChange,
  placeholder,
  tableName,
  labelField,
  searchFields,
  required
}) => {
  const loadOptions = async (inputValue: string) => {
    if (inputValue.length < 2) return [];

    let query = supabase.from(tableName).select(`id, ${labelField}`);
    
    const searchFilters = searchFields.map(field => `${field}.ilike.%${inputValue}%`).join(',');
    query = query.or(searchFilters);

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
      value={value}
      onChange={onChange}
      loadOptions={loadOptions}
      isClearable
      placeholder={placeholder}
      required={required}
      noOptionsMessage={({ inputValue }) => 
        inputValue.length < 2 ? 'Type at least 2 characters to search' : 'No results found'
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
