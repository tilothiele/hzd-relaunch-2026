'use client'

import { useState, useEffect, useMemo } from 'react'
import { Autocomplete, TextField, CircularProgress } from '@mui/material'

interface CountryOption {
    code: string
    name: string
}

interface CountryCodeInputProps {
    value: string
    onChange: (value: string) => void
    label: string
    required?: boolean
}

export function CountryCodeInput({ value, onChange, label, required }: CountryCodeInputProps) {
    const [open, setOpen] = useState(false)
    const [options, setOptions] = useState<CountryOption[]>([])
    const [loading, setLoading] = useState(false)
    const [inputValue, setInputValue] = useState('')

    // Helper to fetch countries
    const fetchCountries = async (search: string) => {
        setLoading(true)
        try {
            const params = new URLSearchParams()
            if (search) params.set('search', search)

            // Only fetch if empty (European list) or >= 3 chars
            if (search && search.length < 3) {
                setLoading(false)
                return
            }

            const res = await fetch(`/api/country?${params.toString()}`)
            if (!res.ok) throw new Error('Failed to fetch')
            const data = await res.json()
            setOptions(data)
        } catch (error) {
            console.error('Error loading countries:', error)
            setOptions([])
        } finally {
            setLoading(false)
        }
    }

    // Debounce Fetch logic
    useEffect(() => {
        const timeoutId = setTimeout(() => {
            if (inputValue.length >= 3) {
                fetchCountries(inputValue)
            } else if (inputValue.length === 0 && open) {
                // Fetch default list (European) if open and empty
                fetchCountries('')
            }
        }, 300)

        return () => clearTimeout(timeoutId)
    }, [inputValue, open])

    // Initial load for "Deutschland" default or mapping value to name?
    // Autocomplete needs the object matching the value to display the label correctly.
    // If we have a value 'DE' but no options loaded, Autocomplete can't show "Deutschland".
    // We should probably pre-load the default list or at least the current value's country.
    // If value is set, ensure it's in options or fetched.
    useEffect(() => {
        if (value && options.length === 0) {
            // Fetch default list to ensure we have the option to display
            // This is a simple approach. Optimally we fetch specific code, but API is search-based.
            // Searching "Deutschland" or just loading default European list (which includes DE) works.
            fetchCountries('')
        }
    }, [value, open]) // Trigger when value exists or dropdown opens

    // Default Value logic: "Standardmäßig Deutschland"
    // If value is empty on mount, set it to DE.
    useEffect(() => {
        if (!value) {
            onChange('DE')
        }
    }, [])

    return (
        <Autocomplete
            open={open}
            onOpen={() => setOpen(true)}
            onClose={() => setOpen(false)}
            options={options}
            getOptionLabel={(option) => option.name}
            // Map the simple string value to an option object
            value={options.find(o => o.code === value) || (value ? { code: value, name: value } : null)}
            onChange={(_, newValue) => {
                onChange(newValue ? newValue.code : '')
            }}
            inputValue={inputValue}
            onInputChange={(_, newInputValue) => {
                setInputValue(newInputValue)
            }}
            isOptionEqualToValue={(option, val) => option.code === val.code}
            loading={loading}
            fullWidth
            size="small"
            renderInput={(params) => (
                <TextField
                    {...params}
                    label={label}
                    required={required}
                    InputProps={{
                        ...params.InputProps,
                        endAdornment: (
                            <>
                                {loading ? <CircularProgress color="inherit" size={20} /> : null}
                                {params.InputProps.endAdornment}
                            </>
                        ),
                    }}
                />
            )}
            // Improve usability
            filterOptions={(x) => x} // Disable client-side filtering since we do server-side
            noOptionsText="Keine Länder gefunden"
        />
    )
}
