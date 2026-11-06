type ProfileItemProps = {
  icon: React.ElementType;
  label: string;
  value: string;
  capitalize?: boolean;
};

const ProfileItem = ({
  icon: Icon,
  label,
  value,
  capitalize,
}: ProfileItemProps) => {
  return (
    <div className='flex items-start gap-3'>
      <div className='mt-0.5 rounded-md bg-muted p-2'>
        <Icon className='size-4 text-muted-foreground' />
      </div>

      <div className='min-w-0'>
        <p className='text-xs text-muted-foreground'>{label}</p>

        <p className={`text-sm font-medium ${capitalize ? "capitalize" : ""}`}>
          {value}
        </p>
      </div>
    </div>
  );
};

export default ProfileItem;
