interface PageHeaderProps {
  title: React.ReactNode;
  description?: React.ReactNode;
  // A lucide icon element, shown in a tile next to the title.
  icon?: React.ReactNode;
  // Page actions (e.g. an "Add" dialog button); they wrap below on phones.
  children?: React.ReactNode;
}

// The one page heading style used across FIIS.
const PageHeader = ({
  title,
  description,
  icon,
  children,
}: PageHeaderProps) => {
  return (
    <div className='flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between'>
      <div className='flex items-center gap-3'>
        {icon && (
          <div className='flex size-10 shrink-0 items-center justify-center rounded-lg border bg-muted/50 [&_svg]:size-5'>
            {icon}
          </div>
        )}
        <div className='min-w-0'>
          <h1 className='text-xl font-semibold tracking-tight sm:text-2xl'>
            {title}
          </h1>
          {description && (
            <p className='text-sm text-muted-foreground'>{description}</p>
          )}
        </div>
      </div>
      {children && <div className='flex flex-wrap gap-2'>{children}</div>}
    </div>
  );
};

export default PageHeader;
