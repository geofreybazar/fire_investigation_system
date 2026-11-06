const PersonnelNotFound = () => {
  return (
    <div className='flex min-h-[300px] items-center justify-center'>
      <div className='text-center'>
        <p className='font-medium'>Personnel not found</p>
        <p className='mt-1 text-sm text-muted-foreground'>
          The personnel record could not be loaded.
        </p>
      </div>
    </div>
  );
};

export default PersonnelNotFound;
