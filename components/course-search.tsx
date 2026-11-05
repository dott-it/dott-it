'use client'

import { useState, useEffect, useCallback } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Search, X, BookOpen } from 'lucide-react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import Link from 'next/link'
import type { CourseMetadata } from '@/lib/course-types'
import { openSciEdBrowseHrefForGradeLevel } from '@/lib/library/browse/open-scied-browse-href'

interface CourseSearchProps {
    initialCourses?: CourseMetadata[]
    onSearch?: (results: CourseMetadata[]) => void
    placeholder?: string
    showFilters?: boolean
}

export function CourseSearch({
    initialCourses = [],
    onSearch,
    placeholder = "Search courses...",
    showFilters = true
}: CourseSearchProps) {
    const [searchTerm, setSearchTerm] = useState('')
    const [subjectFilter, setSubjectFilter] = useState<string>('all')
    const [gradeFilter, setGradeFilter] = useState<string>('all')
    const [statusFilter, setStatusFilter] = useState<string>('all')
    const [results, setResults] = useState<CourseMetadata[]>(initialCourses)
    const [isSearching, setIsSearching] = useState(false)

    // Filter courses based on search term and filters
    const filterCourses = useCallback((courses: CourseMetadata[]) => {
        return courses.filter(course => {
            // Search term filter
            const matchesSearch = !searchTerm ||
                course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                course.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                course.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
                course.grade_level.toLowerCase().includes(searchTerm.toLowerCase())

            // Subject filter
            const matchesSubject = subjectFilter === 'all' || course.subject === subjectFilter

            // Grade filter
            const matchesGrade = gradeFilter === 'all' || course.grade_level === gradeFilter

            // Status filter
            const matchesStatus = statusFilter === 'all' || course.status === statusFilter

            return matchesSearch && matchesSubject && matchesGrade && matchesStatus
        })
    }, [searchTerm, subjectFilter, gradeFilter, statusFilter])

    // Handle search
    const handleSearch = useCallback(async () => {
        if (!searchTerm && subjectFilter === 'all' && gradeFilter === 'all' && statusFilter === 'all') {
            setResults(initialCourses)
            onSearch?.(initialCourses)
            return
        }

        setIsSearching(true)

        try {
            // If we have initial courses, filter them
            if (initialCourses.length > 0) {
                const filtered = filterCourses(initialCourses)
                setResults(filtered)
                onSearch?.(filtered)
            } else {
                // Otherwise, we could make an API call here
                // For now, just use the initial courses
                setResults([])
                onSearch?.([])
            }
        } catch {
            setResults([])
            onSearch?.([])
        } finally {
            setIsSearching(false)
        }
    }, [searchTerm, subjectFilter, gradeFilter, statusFilter, initialCourses, onSearch, filterCourses])

    // Clear search
    const clearSearch = () => {
        setSearchTerm('')
        setSubjectFilter('all')
        setGradeFilter('all')
        setStatusFilter('all')
        setResults(initialCourses)
        onSearch?.(initialCourses)
    }

    // Auto-search when filters change
    useEffect(() => {
        if (initialCourses.length > 0) {
            handleSearch()
        }
    }, [searchTerm, subjectFilter, gradeFilter, statusFilter, initialCourses.length, handleSearch])

    // Get unique subjects, grades, and statuses from courses
    const subjects = [
        ...new Set(initialCourses.map(c => c.subject).filter((subject): subject is string => typeof subject === 'string' && subject.length > 0)),
    ].sort()
    const grades = [
        ...new Set(initialCourses.map(c => c.grade_level).filter((grade): grade is string => typeof grade === 'string' && grade.length > 0)),
    ].sort()
    const statuses = [
        ...new Set(initialCourses.map(c => c.status).filter((status): status is string => typeof status === 'string' && status.length > 0)),
    ].sort()

    return (
        <div className="space-y-4">
            {/* Search Input */}
            <div className="flex gap-2">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                        placeholder={placeholder}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                        aria-label="Search courses"
                    />
                </div>
                <Button
                    variant="outline"
                    onClick={clearSearch}
                    disabled={searchTerm === '' && subjectFilter === 'all' && gradeFilter === 'all' && statusFilter === 'all'}
                >
                    <X className="size-4" />
                </Button>
            </div>

            {/* Filters */}
            {showFilters && (
                <div className="flex flex-wrap gap-2">
                    <Select value={subjectFilter} onValueChange={setSubjectFilter}>
                        <SelectTrigger className="w-[140px]">
                            <SelectValue placeholder="Subject" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Subjects</SelectItem>
                            {subjects.map(subject => (
                                <SelectItem key={subject} value={subject}>{subject}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    <Select value={gradeFilter} onValueChange={setGradeFilter}>
                        <SelectTrigger className="w-[140px]">
                            <SelectValue placeholder="Grade" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Grades</SelectItem>
                            {grades.map(grade => (
                                <SelectItem key={grade} value={grade}>{grade}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger className="w-[140px]">
                            <SelectValue placeholder="Status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Any Status</SelectItem>
                            {statuses.map(status => (
                                <SelectItem key={status} value={status}>{status}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            )}

            {/* Search Results */}
            {results.length > 0 && (
                <div className="space-y-2">
                    <div className="flex items-center justify-between">
                        <h3 className="text-sm font-medium">
                            {results.length} course{results.length === 1 ? '' : 's'} found
                        </h3>
                        {(searchTerm || subjectFilter !== 'all' || gradeFilter !== 'all' || statusFilter !== 'all') && (
                            <Button variant="ghost" size="sm" onClick={clearSearch}>
                                Clear filters
                            </Button>
                        )}
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {results.map((course) => (
                            <Card key={course.course_id} className="overflow-hidden transition-shadow hover:shadow-md">
                                <CardHeader className="bg-muted/40 pb-3">
                                    <CardTitle className="line-clamp-2 text-base font-semibold">
                                        {course.title}
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="pt-3">
                                    <div className="mb-2 flex items-center gap-2">
                                        <Badge variant="outline" className="text-xs">{course.subject}</Badge>
                                        <Badge variant="outline" className="text-xs">{course.grade_level}</Badge>
                                        {course.status && (
                                            <Badge variant={course.status === 'course_output' ? 'default' : 'secondary'} className="text-xs">
                                                {course.status === 'course_output' ? 'Complete' : 'In Progress'}
                                            </Badge>
                                        )}
                                    </div>
                                    <p className="mb-3 line-clamp-2 text-sm text-muted-foreground">
                                        {course.description}
                                    </p>
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs text-muted-foreground">
                                            {course.unit_count} units
                                        </span>
                                        <Button size="sm" asChild>
                                            <Link href={openSciEdBrowseHrefForGradeLevel(course.grade_level)}>
                                              View Grade
                                            </Link>
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>
            )}

            {/* No Results */}
            {results.length === 0 && (searchTerm || subjectFilter !== 'all' || gradeFilter !== 'all' || statusFilter !== 'all') && isSearching === false && (
                <Card>
                    <CardContent className="pt-6 text-center">
                        <BookOpen className="mx-auto mb-4 size-12 text-muted-foreground" />
                        <h3 className="mb-2 text-lg font-semibold">No courses found</h3>
                        <p className="mb-4 text-muted-foreground">
                            Try adjusting your search terms or filters.
                        </p>
                        <Button variant="outline" onClick={clearSearch}>
                            Clear Search
                        </Button>
                    </CardContent>
                </Card>
            )}

            {/* Loading State */}
            {isSearching && (
                <Card>
                    <CardContent className="pt-6 text-center">
                        <div
                            className="mx-auto mb-4 size-8 animate-spin rounded-full border-b-2 border-primary"
                            aria-hidden
                        />
                        <p className="text-muted-foreground" role="status">
                            Searching courses...
                        </p>
                    </CardContent>
                </Card>
            )}
        </div>
    )
} 