import type { Address } from '../../types';
import Input from '../../components/ui/Input';

interface AddressFormProps {
  value: Partial<Address>;
  onChange: (address: Partial<Address>) => void;
  errors?: Partial<Record<keyof Address, string>>;
}

export default function AddressForm({ value, onChange, errors = {} }: AddressFormProps) {
  function update(field: keyof Address, fieldValue: string) {
    onChange({ ...value, [field]: fieldValue });
  }

  return (
    <fieldset className="space-y-3">
      <legend className="text-sm font-semibold text-text-secondary mb-2">Address</legend>
      <Input
        label="Street"
        value={value.street ?? ''}
        onChange={(e) => update('street', e.target.value)}
        error={errors.street}
        placeholder="123 Main St"
      />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Input
          label="City"
          value={value.city ?? ''}
          onChange={(e) => update('city', e.target.value)}
          error={errors.city}
          placeholder="New York"
        />
        <Input
          label="State"
          value={value.state ?? ''}
          onChange={(e) => update('state', e.target.value)}
          error={errors.state}
          placeholder="NY"
        />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Input
          label="ZIP Code"
          value={value.zipCode ?? ''}
          onChange={(e) => update('zipCode', e.target.value)}
          error={errors.zipCode}
          placeholder="10001"
        />
        <Input
          label="Country"
          value={value.country ?? ''}
          onChange={(e) => update('country', e.target.value)}
          error={errors.country}
          placeholder="US"
        />
      </div>
    </fieldset>
  );
}
