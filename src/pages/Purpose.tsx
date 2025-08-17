"use client"

import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useForm } from "react-hook-form"

import { Trash2, Edit, Plus, RefreshCcw } from "lucide-react"
import { apiService } from "../services/api"
import { Button } from "../components/common/Button"
import { Card } from "../components/common/Card"
import ReloadButton from "../components/common/ReloadButton"

const LoadingSpinner = () => (
  <div className="flex justify-center items-center p-4">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
  </div>
)

interface Purpose {
  _id: string
  title: string
  createdAt: string
  updatedAt: string
}

export default function PurposePage() {
  const queryClient = useQueryClient()
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(1)
  const [limit] = useState(10)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Purpose | null>(null)

  // Form
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<{ title: string }>()

  // Fetch Purposes
  const { data, isLoading, refetch } = useQuery({
    queryKey: ["purposes", page, search],
    queryFn: () => apiService.getPurposes({ page, limit, search }),
    refetchOnMount: true,
  })
  console.log('purpose data', data)
  const createMutation = useMutation({
    mutationFn: (payload: { title: string }) => apiService.createPurpose(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["purposes"] })
      setModalOpen(false)
      reset()
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, title }: { id: string; title: string }) => apiService.updatePurpose(id, { title }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["purposes"] })
      setModalOpen(false)
      setEditing(null)
      reset()
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiService.deletePurpose(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["purposes"] })
    },
  })

  // Handlers
  const onSubmit = (values: { title: string }) => {
    if (editing) {
      updateMutation.mutate({ id: editing._id, title: values.title })
    } else {
      createMutation.mutate(values)
    }
  }

  const openCreateModal = () => {
    setEditing(null)
    reset()
    setModalOpen(true)
  }

  const openEditModal = (purpose: Purpose) => {
    setEditing(purpose)
    reset({ title: purpose.title })
    setModalOpen(true)
  }

  const handleDelete = (id: string) => {
    if (window.confirm("Are you sure you want to delete this purpose?")) {
      deleteMutation.mutate(id)
    }
  }

  const purposes = data?.purposes || []
  const pagination = data?.pagination

  return (
    <div className="space-y-6 ">
      <ReloadButton />
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Purposes</h1>
          <Button onClick={openCreateModal} className="gradient-btn">
            <Plus className="w-4 h-4 mr-2 " /> Add Purpose
          </Button>
        </div>

        {/* Search */}
        <input
          placeholder="Search purposes..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value)
            setPage(1)
          }}
          className="pl-10 pr-4 py-2 mb-6 w-full border focus:outline-none border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />

        {/* Table */}
        <Card className="p-4 mb-6">
          {isLoading ? (
            <LoadingSpinner />
          ) : (
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="py-2 text-left">Title</th>
                  <th className="py-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {purposes.length > 0 ? (
                  purposes.map((purpose: Purpose) => (
                    <tr key={purpose._id} className="border-b">
                      <td className="py-2">{purpose.title}</td>
                      <td className="py-2 text-right space-x-2">
                        <button className=" text-blue-600 hover:text-blue-900" onClick={() => openEditModal(purpose)}>
                          <Edit className="w-4 h-4" />
                        </button>
                        <Button size="sm" variant="destructive" onClick={() => handleDelete(purpose._id)}>
                          <Trash2 className="w-4 h-4 text-red-600 hover:text-red-900" />
                        </Button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={2} className="py-4 text-center text-gray-500">
                      No purposes found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </Card>

        <div className="flex justify-end space-x-2">
          <Button disabled={page === 1} onClick={() => setPage((p) => p - 1)} variant="outline">
            Previous
          </Button>
          <Button
            disabled={!pagination || page >= pagination.pages}
            onClick={() => setPage((p) => p + 1)}
            variant="outline"
          >
            Next
          </Button>
        </div>

      </div>

      {/* Modal */}
      {modalOpen && (
        <div
          style={{ marginTop: 0 }}
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
        >
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">{editing ? "Edit Purpose" : "Add Purpose"}</h2>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 gap-4">
                  <div className="space-y-1">
                    <label className="block text-sm font-medium text-gray-700">Purpose Title</label>
                    <input
                      placeholder="Purpose title"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      {...register("title", { required: true })}
                    />
                    {errors.title && <p className="text-sm text-red-600">Purpose title is required</p>}
                  </div>
                </div>

                <div className="flex justify-end space-x-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setModalOpen(false)
                      setEditing(null)
                      reset()
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    className="gradient-btn text-white"
                    disabled={createMutation.isPending || updateMutation.isPending}
                  >
                    {editing ? "Update Purpose" : "Create Purpose"}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
