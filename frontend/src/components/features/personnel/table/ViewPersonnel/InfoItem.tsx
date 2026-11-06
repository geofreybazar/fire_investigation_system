interface InfoItemProps {
  label: string;
  value: string;
  icon?: React.ReactNode;
}
const InfoItem = ({ label, value, icon }: InfoItemProps) => {
  return (
    <div className='min-w-0 space-y-1.5'>
      <p className='text-xs font-medium text-muted-foreground'>{label}</p>

      <div className='flex min-w-0 items-center gap-2'>
        {icon && <span className='shrink-0 text-muted-foreground'>{icon}</span>}

        <p className='truncate text-sm font-medium'>{value}</p>
      </div>
    </div>
  );
};

export default InfoItem;
