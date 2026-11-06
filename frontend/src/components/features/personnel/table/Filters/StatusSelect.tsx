import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface StatusSelectProps {
  status: string;
  setStatus: (status: "Active" | "Inactive") => void;
  setCurrentPage: (page: number) => void;
}

const StatusSelect = ({
  status,
  setStatus,
  setCurrentPage,
}: StatusSelectProps) => {
  return (
    <Select
      value={status}
      onValueChange={(value) => {
        if (value === "Active" || value === "Inactive") {
          setStatus(value);
        }
        setCurrentPage(1);
      }}
    >
      <SelectTrigger className='w-full sm:w-48 cursor-pointer'>
        <SelectValue placeholder='All Status' />
      </SelectTrigger>

      <SelectContent>
        <SelectItem value='Active'>Active</SelectItem>
        <SelectItem value='Inactive'>Inactive</SelectItem>
      </SelectContent>
    </Select>
  );
};

export default StatusSelect;
