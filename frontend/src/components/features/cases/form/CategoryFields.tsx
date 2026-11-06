import { Suspense, useEffect } from "react";
import { useFormContext, useWatch } from "react-hook-form";
import useGetAllClassifications from "@/hooks/incidentClassification/useGetAllClassifications";
import { Skeleton } from "@/components/ui/skeleton";
import { SelectField, type Option } from "@/components/common/form/FormFields";

interface CategoryFormValues {
  categoryId: string;
  subcategoryId?: string;
}

interface CategoryFieldsProps {
  // The case's current category, kept as an option in case it is no
  // longer returned by the categories list.
  current?: { category?: Option; subcategory?: Option };
}

const CategoryOptions = ({ current }: CategoryFieldsProps) => {
  const { getValues, setValue } = useFormContext<CategoryFormValues>();
  const categoryId = useWatch<CategoryFormValues>({ name: "categoryId" }) as string;
  const { categories } = useGetAllClassifications();

  const categoryOptions: Option[] = categories.map((category) => ({
    value: category.id,
    label: category.name,
  }));
  if (
    current?.category &&
    !categoryOptions.some((option) => option.value === current.category?.value)
  ) {
    categoryOptions.unshift(current.category);
  }

  const selected = categories.find((category) => category.id === categoryId);
  const subcategoryOptions: Option[] = selected
    ? selected.subCategories.map((sub) => ({ value: sub.id, label: sub.name }))
    : current?.subcategory && categoryId === current.category?.value
      ? [current.subcategory]
      : [];

  // Clear a subcategory that doesn't belong to the newly chosen category.
  const knownSubcategoryIds = selected
    ? selected.subCategories.map((sub) => sub.id).join(",")
    : null;
  useEffect(() => {
    const subcategoryId = getValues("subcategoryId");
    if (
      knownSubcategoryIds !== null &&
      subcategoryId &&
      !knownSubcategoryIds.split(",").includes(subcategoryId)
    ) {
      setValue("subcategoryId", undefined);
    }
  }, [knownSubcategoryIds, getValues, setValue]);

  return (
    <>
      <SelectField<CategoryFormValues>
        name='categoryId'
        label='Category'
        placeholder='Select category'
        options={categoryOptions}
      />
      <SelectField<CategoryFormValues>
        name='subcategoryId'
        label='Subcategory (optional)'
        placeholder={
          subcategoryOptions.length ? "Select subcategory" : "No subcategories"
        }
        options={subcategoryOptions}
        disabled={!subcategoryOptions.length}
      />
    </>
  );
};

const CategoryFields = ({ current }: CategoryFieldsProps) => (
  <div className='grid gap-3 sm:grid-cols-2'>
    <Suspense
      fallback={
        <>
          <Skeleton className='h-9 w-full' />
          <Skeleton className='h-9 w-full' />
        </>
      }
    >
      <CategoryOptions current={current} />
    </Suspense>
  </div>
);

export default CategoryFields;
