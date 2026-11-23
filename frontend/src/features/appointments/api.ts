import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, unwrap } from '../../api/client';
import { queryKeys } from '../../api/queryKeys';
import type { components, paths } from '../../api/schema';

export type Appointment = components['schemas']['Appointment'];
export type AppointmentDetail = components['schemas']['AppointmentDetail'];
export type Proposal = components['schemas']['Proposal'];
export type AppointmentAction = components['schemas']['AppointmentAction'];
export type CreateAppointmentRequest = components['schemas']['CreateAppointmentRequest'];
export type CreateProposalRequest = components['schemas']['CreateProposalRequest'];
export type AppointmentListQuery = NonNullable<paths['/appointments']['get']['parameters']['query']>;

/** UC24 Lịch tập của tôi (hội viên, PT) hoặc lọc theo hội viên, PT (Staff, Admin). */
export const useAppointments = (params: AppointmentListQuery) =>
  useQuery({
    queryKey: queryKeys.appointments(params),
    queryFn: async () => unwrap(await api.GET('/appointments', { params: { query: params } })),
    placeholderData: keepPreviousData,
  });

/** UC24–UC26 Chi tiết lịch: dòng thời gian đề xuất, `allowedActions` tính cho người gọi. */
export const useAppointment = (id: string) =>
  useQuery({
    queryKey: queryKeys.appointment(id),
    queryFn: async () => unwrap(await api.GET('/appointments/{id}', { params: { path: { id } } })),
    enabled: !!id,
  });

/** Sau mỗi hành động: cập nhật chi tiết, làm mới danh sách và số buổi trong gói. */
const useRefreshAfterAction = () => {
  const qc = useQueryClient();
  return (appointment?: Appointment) => {
    if (appointment) qc.setQueryData(queryKeys.appointment(appointment.id), appointment);
    void qc.invalidateQueries({ queryKey: queryKeys.appointments() });
    void qc.invalidateQueries({ queryKey: queryKeys.subscriptions() });
    if (appointment) void qc.invalidateQueries({ queryKey: queryKeys.appointment(appointment.id) });
  };
};

/** UC23 Đề xuất lịch ban đầu (INITIAL), chờ PT trả lời. */
export const useCreateAppointment = () => {
  const refresh = useRefreshAfterAction();
  return useMutation({
    mutationFn: async (body: CreateAppointmentRequest) => unwrap(await api.POST('/appointments', { body })),
    onSuccess: refresh,
  });
};

/** UC24, UC25 Đề xuất giờ khác (COUNTER), xin đổi (RESCHEDULE), xin hủy (CANCEL). Gửi kèm `expectedVersion`. */
export const useProposeAppointment = () => {
  const refresh = useRefreshAfterAction();
  return useMutation({
    mutationFn: async ({ id, body }: { id: string; body: CreateProposalRequest }) =>
      unwrap(await api.POST('/appointments/{id}/proposals', { params: { path: { id } }, body })),
    onSuccess: refresh,
  });
};

/** UC24, UC25 Đồng ý đề xuất đang mở. */
export const useAcceptAppointment = () => {
  const refresh = useRefreshAfterAction();
  return useMutation({
    mutationFn: async ({ id, expectedVersion }: { id: string; expectedVersion: number }) =>
      unwrap(
        await api.POST('/appointments/{id}/accept', { params: { path: { id } }, body: { expectedVersion } }),
      ),
    onSuccess: refresh,
  });
};

/** UC24, UC25 Từ chối đề xuất đang mở, bắt buộc lý do. */
export const useRejectAppointment = () => {
  const refresh = useRefreshAfterAction();
  return useMutation({
    mutationFn: async ({
      id,
      expectedVersion,
      reason,
    }: {
      id: string;
      expectedVersion: number;
      reason: string;
    }) =>
      unwrap(
        await api.POST('/appointments/{id}/reject', {
          params: { path: { id } },
          body: { expectedVersion, reason },
        }),
      ),
    onSuccess: refresh,
  });
};

/** UC27 PT hoặc Admin xác nhận buổi đã qua giờ kết thúc: COMPLETED hoặc NO_SHOW, cả hai đều trừ 1 buổi. */
export const useCompleteAppointment = () => {
  const refresh = useRefreshAfterAction();
  return useMutation({
    mutationFn: async ({
      id,
      body,
    }: {
      id: string;
      body: components['schemas']['CompleteAppointmentRequest'];
    }) => unwrap(await api.POST('/appointments/{id}/complete', { params: { path: { id } }, body })),
    onSuccess: refresh,
  });
};
