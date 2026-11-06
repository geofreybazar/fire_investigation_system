import { Suspense, useState } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { FolderSearch, Plus, Search } from "lucide-react";
import useDebounce from "@/hooks/useDebounce";
import { useUserStore } from "@/store/userStore";
import { CASE_STATES, type CaseState } from "@/constants/investigation";
import {
  canCreateCases,
  canViewCases,
  isSuperAdmin,
} from "@/utils/casePermissions";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import DialogComponent from "@/components/common/DialogComponent";
import PageHeader from "@/components/common/PageHeader";
import ErrorFallbackComponent from "@/components/common/ErrorFallbackComponent";
import TableSkeleton from "@/components/common/TableSkeleton";
import CaseTable from "@/components/features/cases/list/CaseTable";
import DeletedCaseTable from "@/components/features/cases/list/DeletedCaseTable";
import NewCaseForm from "@/components/features/cases/form/NewCaseForm";
import CategoryFilter, {
  type CategoryOption,
} from "@/components/features/cases/list/CategoryFilter";

const ALL = "ALL";
const NO_CATEGORY: CategoryOption = { id: "", label: "" };

const STATE_LABEL: Record<CaseState, string> = {
  OPEN: "Investigation open",
  CLOSED: "No open investigation",
};

// Date inputs give a calendar day; the bounds cover that whole day in
// Philippine time.
const startOfDay = (date: string) =>
  date ? `${date}T00:00:00.000+08:00` : undefined;
const endOfDay = (date: string) =>
  date ? `${date}T23:59:59.999+08:00` : undefined;

const Cases = () => {
  const user = useUserStore((state) => state.user);
  const [currentPage, setCurrentPage] = useState(1);
  const [search, setSearch] = useState("");
  const [state, setState] = useState<string>(ALL);
  const [category, setCategory] = useState<CategoryOption>(NO_CATEGORY);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [openNew, setOpenNew] = useState(false);
  const debouncedSearch = useDebounce(search, 500);

  if (!canViewCases(user)) {
    return (
      <div className='rounded-lg border p-10 text-center text-sm text-muted-foreground'>
        Your role does not have access to investigation cases.
      </div>
    );
  }

  const filters = {
    page: currentPage,
    search: debouncedSearch || undefined,
    state: state === ALL ? undefined : (state as CaseState),
    categoryId: category.id || undefined,
    from: startOfDay(fromDate),
    to: endOfDay(toDate),
  };

  const clearFilters = () => {
    setSearch("");
    setState(ALL);
    setCategory(NO_CATEGORY);
    setFromDate("");
    setToDate("");
    setCurrentPage(1);
  };

  const list = (
    <div className='space-y-4'>
      <div className='flex flex-col gap-3 sm:flex-row'>
        <div className='relative flex-1'>
          <Search className='absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground' />
          <Input
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setCurrentPage(1);
            }}
            placeholder='Search case number, place or barangay'
            className='pl-9'
          />
        </div>
        <Select
          value={state}
          onValueChange={(value) => {
            setState(value ?? ALL);
            setCurrentPage(1);
          }}
        >
          <SelectTrigger className='sm:w-56'>
            <SelectValue>
              {state === ALL ? "All cases" : STATE_LABEL[state as CaseState]}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>All cases</SelectItem>
            {CASE_STATES.map((value) => (
              <SelectItem key={value} value={value}>
                {STATE_LABEL[value]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className='flex flex-col gap-3 sm:flex-row sm:items-center'>
        <CategoryFilter
          category={category}
          setCategory={(selected) => {
            setCategory(selected);
            setCurrentPage(1);
          }}
        />
        <label className='flex items-center gap-2 text-sm text-muted-foreground'>
          Fire date from
          <Input
            type='date'
            value={fromDate}
            max={toDate || undefined}
            onChange={(event) => {
              setFromDate(event.target.value);
              setCurrentPage(1);
            }}
            className='w-auto'
          />
        </label>
        <label className='flex items-center gap-2 text-sm text-muted-foreground'>
          to
          <Input
            type='date'
            value={toDate}
            min={fromDate || undefined}
            onChange={(event) => {
              setToDate(event.target.value);
              setCurrentPage(1);
            }}
            className='w-auto'
          />
        </label>
      </div>

      <ErrorBoundary FallbackComponent={ErrorFallbackComponent}>
        <Suspense fallback={<TableSkeleton />}>
          <CaseTable
            filters={filters}
            setCurrentPage={setCurrentPage}
            onClearFilters={clearFilters}
          />
        </Suspense>
      </ErrorBoundary>
    </div>
  );

  return (
    <div className='space-y-6'>
      <PageHeader
        icon={<FolderSearch />}
        title='Investigation Cases'
        description='Open, refer and follow fire investigation cases.'
      >
        {canCreateCases(user) && (
          <DialogComponent
            open={openNew}
            modalOnChange={setOpenNew}
            buttonLabel='New Case'
            dialogTitle='New Investigation Case'
            dialogDescription='The case is handled by your office, and its first investigation is assigned to the investigator you choose.'
            icon={<Plus className='mr-2 size-4' />}
            classname='sm:max-w-2xl'
          >
            <NewCaseForm onDone={() => setOpenNew(false)} />
          </DialogComponent>
        )}
      </PageHeader>

      {isSuperAdmin(user) ? (
        <Tabs defaultValue='cases'>
          <TabsList>
            <TabsTrigger value='cases'>Cases</TabsTrigger>
            <TabsTrigger value='deleted'>Deleted</TabsTrigger>
          </TabsList>
          <TabsContent value='cases' className='pt-4'>
            {list}
          </TabsContent>
          <TabsContent value='deleted' className='pt-4'>
            <ErrorBoundary FallbackComponent={ErrorFallbackComponent}>
              <Suspense fallback={<TableSkeleton />}>
                <DeletedCaseTable />
              </Suspense>
            </ErrorBoundary>
          </TabsContent>
        </Tabs>
      ) : (
        list
      )}
    </div>
  );
};

export default Cases;
