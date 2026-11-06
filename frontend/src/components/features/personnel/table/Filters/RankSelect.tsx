import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RANKS, type Rank } from "@/constants/personnel";

interface RankSelectProps {
  rank: Rank | undefined;
  setRank: (rank: Rank | undefined) => void;
}

const RankSelect = ({ rank, setRank }: RankSelectProps) => {
  return (
    <Select
      value={rank ?? "All Ranks"}
      onValueChange={(value) => {
        if (value) {
          console.log("vher", value);
          console.log(typeof value);
          if (value === "All Ranks") {
            console.log("asdsads");
            setRank(undefined);
          } else {
            setRank(value as Rank);
          }
        }
      }}
    >
      <SelectTrigger className='w-full sm:w-48 cursor-pointer'>
        <SelectValue placeholder='All Ranks' />
      </SelectTrigger>

      <SelectContent>
        <SelectItem value={"All Ranks"}>All Ranks</SelectItem>

        {RANKS.map((rank) => (
          <SelectItem key={rank} value={rank}>
            {rank}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};

export default RankSelect;
