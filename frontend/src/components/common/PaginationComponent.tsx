import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

interface PaginationComponentProps {
  totalPages: number;
  setCurrentPage: (n: number) => void;
  currentPage: number;
}

const PAGESTOSHOW = 3;

const PaginationComponent = ({
  totalPages,
  setCurrentPage,
  currentPage,
}: PaginationComponentProps) => {
  const getPageNumbers = () => {
    const pages = [];
    const halfWindow = Math.floor(PAGESTOSHOW / 2);

    let start = Math.max(1, currentPage - halfWindow);
    let end = Math.min(totalPages, start + PAGESTOSHOW - 1);

    if (end - start < PAGESTOSHOW - 1) {
      start = Math.max(1, end - PAGESTOSHOW + 1);
    }

    if (start > 1) pages.push(1);
    if (start > 2) pages.push("ellipsis");

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }

    if (end < totalPages - 1) pages.push("ellipsis");
    if (end < totalPages) pages.push(totalPages);

    return pages;
  };

  const pages = getPageNumbers();

  return (
    <Pagination>
      <PaginationContent>
        <PaginationItem>
          <PaginationPrevious
            href='#'
            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
            className={
              currentPage === 1 ? "pointer-events-none opacity-50" : ""
            }
          />
        </PaginationItem>

        {pages.map((page, idx) => (
          <PaginationItem key={idx}>
            {page === "ellipsis" ? (
              <PaginationEllipsis />
            ) : (
              <PaginationLink
                href='#'
                isActive={page === currentPage}
                onClick={() => setCurrentPage(page as number)}
              >
                {page}
              </PaginationLink>
            )}
          </PaginationItem>
        ))}

        <PaginationItem>
          <PaginationNext
            href='#'
            onClick={() =>
              setCurrentPage(Math.min(totalPages, currentPage + 1))
            }
            className={
              currentPage === totalPages ? "pointer-events-none opacity-50" : ""
            }
          />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  );
};

export default PaginationComponent;
