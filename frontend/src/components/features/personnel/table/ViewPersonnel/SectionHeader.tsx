interface SectionHeaderProps {
  icon: React.ReactNode;
  title: string;
}

const SectionHeader = ({ icon, title }: SectionHeaderProps) => {
  return (
    <div className='flex items-center gap-2'>
      <div className='flex size-8 items-center justify-center rounded-md bg-muted'>
        {icon}
      </div>

      <h3 className='text-sm font-semibold'>{title}</h3>
    </div>
  );
};

export default SectionHeader;
