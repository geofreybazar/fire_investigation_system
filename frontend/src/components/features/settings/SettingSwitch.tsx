import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

interface SettingSwitchProps {
  id: string;
  label: string;
  description: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  disabled?: boolean;
}

const SettingSwitch = ({
  id,
  label,
  description,
  checked,
  onCheckedChange,
  disabled,
}: SettingSwitchProps) => {
  return (
    <div className='flex items-center justify-between gap-4'>
      <div className='min-w-0'>
        <Label htmlFor={id} className='text-sm font-medium'>
          {label}
        </Label>

        <p className='text-sm text-muted-foreground'>{description}</p>
      </div>

      <Switch
        id={id}
        checked={checked}
        onCheckedChange={onCheckedChange}
        disabled={disabled}
      />
    </div>
  );
};

export default SettingSwitch;
