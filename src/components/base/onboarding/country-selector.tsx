import React, { useState, useEffect } from 'react';
import {
    Command,
    CommandInput,
    CommandItem,
    CommandGroup,
    CommandList,
    CommandEmpty,
} from '@onaeko/ui/command';
import {
    Popover,
    PopoverTrigger,
    PopoverContent,
} from '@onaeko/ui/popover';
import { Button } from '@onaeko/ui/button';
import { Label } from '@onaeko/ui/label';
import { Check, ChevronsUpDown } from 'lucide-react';
import { cn } from '@onaeko/ui';
import helper from '@/utils/helpers.util';
import type { ICountry } from '@/utils/interfaces.util';

interface CountrySelectorProps {
    value?: string; // country code2 (e.g., "NG")
    onChange: (countryCode: string) => void;
    disabled?: boolean;
    error?: boolean;
    label?: string;
    required?: boolean;
}

export const CountrySelector: React.FC<CountrySelectorProps> = ({
    value,
    onChange,
    disabled = false,
    error = false,
    label = 'Country',
    required = false,
}) => {
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState('');
    const [countries, setCountries] = useState<ICountry[]>([]);
    const [selectedCountry, setSelectedCountry] = useState<ICountry | null>(
        null,
    );

    useEffect(() => {
        const allCountries = helper.readCountries();
        setCountries(allCountries);

        // Set default to Nigeria if no value
        if (!value) {
            const nigeria = helper.getCountry('NG');
            if (nigeria) {
                setSelectedCountry(nigeria);
                onChange('NG');
            }
        } else {
            const country = helper.getCountry(value);
            if (country) {
                setSelectedCountry(country);
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [value]);

    const filteredCountries = countries.filter((country) =>
        country.name.toLowerCase().includes(search.toLowerCase()),
    );

    const handleSelect = (countryCode: string) => {
        const country = helper.getCountry(countryCode);
        if (country) {
            setSelectedCountry(country);
            onChange(countryCode);
            setOpen(false);
            setSearch('');
        }
    };

    return (
        <div className="space-y-2">
            {label && (
                <Label className="text-sm font-medium text-foreground">
                    {label} {required && '*'}
                </Label>
            )}
            <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                    <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={open}
                        disabled={disabled}
                        className={cn(
                            'w-full h-10 justify-between text-sm',
                            error && 'border-destructive',
                        )}
                    >
                        {selectedCountry ? (
                            <span className="flex items-center gap-2">
                                {selectedCountry.flag ? (
                                    <img
                                        src={selectedCountry.flag}
                                        alt={selectedCountry.name}
                                        className="w-5 h-5 rounded-md object-cover"
                                        onError={(e) => {
                                            e.currentTarget.style.display =
                                                'none';
                                        }}
                                    />
                                ) : (
                                    <span className="w-5 h-5 flex items-center justify-center text-xs">
                                        🏳️
                                    </span>
                                )}
                                <span className="truncate">
                                    {selectedCountry.name}
                                </span>
                            </span>
                        ) : (
                            'Select country'
                        )}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                </PopoverTrigger>
                <PopoverContent
                    className="w-full p-0 sm:w-[400px]"
                    align="start"
                >
                    <Command>
                        <CommandInput
                            placeholder="Search country..."
                            value={search}
                            onValueChange={setSearch}
                            className="h-10"
                        />
                        <CommandList>
                            <CommandEmpty>No country found.</CommandEmpty>
                            <CommandGroup>
                                {filteredCountries.map((country) => (
                                    <CommandItem
                                        key={country.code2}
                                        value={country.name}
                                        onSelect={() =>
                                            handleSelect(country.code2)
                                        }
                                        className="cursor-pointer"
                                    >
                                        <div className="flex items-center gap-2 flex-1">
                                            {country.flag ? (
                                                <img
                                                    src={country.flag}
                                                    alt={country.name}
                                                    className="w-5 h-5 rounded-md object-cover"
                                                    onError={(e) => {
                                                        e.currentTarget.style.display =
                                                            'none';
                                                    }}
                                                />
                                            ) : (
                                                <span className="w-5 h-5 flex items-center justify-center text-xs">
                                                    🏳️
                                                </span>
                                            )}
                                            <span className="flex-1 truncate">
                                                {country.name}
                                            </span>
                                            {selectedCountry?.code2 ===
                                            country.code2 ? (
                                                <Check className="ml-auto h-4 w-4 text-primary" />
                                            ) : null}
                                        </div>
                                    </CommandItem>
                                ))}
                            </CommandGroup>
                        </CommandList>
                    </Command>
                </PopoverContent>
            </Popover>
        </div>
    );
};

export default CountrySelector;
