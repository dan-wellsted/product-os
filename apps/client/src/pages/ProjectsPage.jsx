import React, { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useInfiniteQuery } from "@tanstack/react-query";
import { listProjects } from "../api/projects.js";

const PAGE_SIZE = 12;

export default function ProjectsPage() {
  const [formState, setFormState] = useState({ q: "" });
  const [filters, setFilters] = useState({ q: "" });

  const {
    data,
    isLoading,
    isError,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    refetch,
  } = useInfiniteQuery({
    queryKey: ["projects", filters],
    initialPageParam: null,
    queryFn: ({ pageParam }) =>
      listProjects({
        ...filters,
        take: PAGE_SIZE,
        cursor: pageParam ?? undefined,
      }),
    getNextPageParam: (lastPage) => lastPage?.meta?.nextCursor ?? undefined,
  });

  const projects = useMemo(() => {
    if (!data?.pages?.length) return [];
    return data.pages.flatMap((page) => page?.data ?? []);
  }, [data]);

  const onSubmitSearch = (event) => {
    event.preventDefault();
    setFilters((prev) => ({
      ...prev,
      q: formState.q.trim(),
    }));
  };

  return (
    <div className="stack">
      <header className="cluster">
        <div>
          <h1 className="page-title">Projects</h1>
          <p className="muted">Select a project to dive into its discovery efforts.</p>
        </div>
        <form className="cluster" onSubmit={onSubmitSearch}>
          <input
            type="search"
            placeholder="Search"
            value={formState.q}
            onChange={(event) => setFormState({ q: event.target.value })}
          />
          <button type="submit" className="btn-outline">
            Search
          </button>
          <button
            type="button"
            className="btn-outline"
            onClick={() => {
              setFormState({ q: "" });
              setFilters({ q: "" });
              refetch();
            }}
          >
            Reset
          </button>
        </form>
      </header>

      {isLoading ? <p>Loading projects…</p> : null}
      {isError ? <p className="muted">Unable to load projects: {error?.message}</p> : null}

      {!isLoading && !isError ? (
        projects.length ? (
          <>
            <div className="grid two">
              {projects.map((project) => (
                <section key={project.id} className="card stack">
                  <header>
                    <h2>{project.name}</h2>
                  </header>
                  <p className="muted">{project.description || "No description provided."}</p>
                  <footer className="cluster">
                    <Link className="btn" to={`/projects/${project.id}`}>
                      View Details
                    </Link>
                    <Link className="btn-outline" to={`/projects/${project.id}/discovery`}>
                      Open Discovery
                    </Link>
                  </footer>
                </section>
              ))}
            </div>
            {hasNextPage ? (
              <button type="button" className="btn" onClick={() => fetchNextPage()} disabled={isFetchingNextPage}>
                {isFetchingNextPage ? "Loading…" : "Load more"}
              </button>
            ) : (
              <p className="muted">End of project list.</p>
            )}
          </>
        ) : (
          <p className="muted">No projects match your filters.</p>
        )
      ) : null}
    </div>
  );
}
