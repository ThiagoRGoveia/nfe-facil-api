export type Pagination = {
  pageSize: number;
  currentPage: number;
};

export type ParsedPagination = {
  limit: number;
  offset: number;
};
