import { useCallback } from 'react';
import useContextType from '@/context/useContextType';
import storage from '@/services/storage';
import {
    GET_LOGGEDIN_USER,
    GET_TALENT,
    GET_TALENTS,
    GET_USERS,
    SET_ITEMS,
} from '@/context/helpers/types';
import type { IListQuery } from '@/utils/interfaces.util';
import type { ICollection } from '@/context/helpers/interface';
import useNetwork from '../shared/useNetwork';
import { OnaekoAPI } from '@/api/base/config';

interface ISendUsersUpdate {
    title: string;
    content: string;
    users: Array<string>;
}

interface IInviteTalent {
    title: string;
    content: string;
    email: string;
    firstName: string;
    lastName: string;
    callbackUrl: string;
}

const useUser = () => {
    const { userContext, appContext } = useContextType();
    const { popNetwork } = useNetwork(false);
    const {
        users,
        user,
        talent,
        loading,
        setLoading,
        unsetLoading,
        setCollection,
        setResource,
    } = userContext;

    const talents = (appContext as any)?.talents ||
        (userContext as any)?.talents || {
            data: [],
            count: 0,
            total: 0,
            pagination: {},
            loading: false,
        };
    const items = appContext.items || [];
    const loader = (userContext as any)?.loader || loading;

    const setItems = (data: Array<any>) => {
        setResource(SET_ITEMS, data);
    };

    const getFullname = (data: any) => {
        let result: string = '--';

        if (data && 'firstName' in data && 'lastName' in data) {
            result = `${data.firstName} ${data.lastName}`;
        }

        return result;
    };

    const getUsers = useCallback(
        async (data: IListQuery, all: boolean = false) => {
            setLoading({ option: 'resource', type: GET_USERS });

            const response = await OnaekoAPI.user.getUsers(data, all);

            if (response.error === false) {
                if (response.status === 200) {
                    const result: ICollection = {
                        count: response.count!,
                        total: response.total!,
                        data: response.data,
                        pagination: response.pagination!,
                        loading: false,
                        message:
                            response.data.length > 0
                                ? `displaying ${response.count!} users`
                                : 'There are no users currently',
                    };
                    setCollection(GET_USERS, result);
                }
            } else {
                unsetLoading({
                    option: 'resource',
                    type: GET_USERS,
                    message: response.message
                        ? response.message
                        : response.data,
                });

                if (response.status === 401) {
                    OnaekoAPI.auth.logout();
                } else if (
                    response.message &&
                    response.message === 'Error: Network Error'
                ) {
                    popNetwork();
                } else if (response.data) {
                    console.log(`Error! Could not get users ${response.data}`);
                }
            }
        },
        [setLoading, unsetLoading, setCollection, popNetwork],
    );

    const getUser = useCallback(
        async (id?: string) => {
            const userId = id ? id : storage.getUserID();

            setLoading({ option: 'default' });

            const response = await OnaekoAPI.user.getUser(userId);

            if (response.error === false) {
                setResource(GET_LOGGEDIN_USER, response.data);
                unsetLoading({
                    option: 'default',
                    message: 'data fetched successfully',
                });
            } else {
                setResource(GET_LOGGEDIN_USER, {});
                unsetLoading({
                    option: 'default',
                    message: response.message
                        ? response.message
                        : response.data,
                });

                if (response.status === 401) {
                    OnaekoAPI.auth.logout();
                } else if (
                    response.message &&
                    response.message === 'Error: Network Error'
                ) {
                    popNetwork();
                } else if (response.data) {
                    console.log(`Error! Could not get user ${response.data}`);
                }
            }
        },
        [setLoading, unsetLoading, setResource, popNetwork],
    );

    const getTalents = useCallback(
        async (data: IListQuery) => {
            setLoading({ option: 'resource', type: GET_TALENTS });

            const response = await OnaekoAPI.user.getTalents(data);

            if (response.error === false) {
                if (response.status === 200) {
                    const result: ICollection = {
                        count: response.count!,
                        total: response.total!,
                        data: response.data,
                        pagination: response.pagination!,
                        loading: false,
                        message:
                            response.data.length > 0
                                ? `displaying ${response.count!} talents`
                                : 'There are no talents currently',
                    };
                    setCollection(GET_TALENTS, result);
                }
            } else {
                unsetLoading({
                    option: 'resource',
                    type: GET_TALENTS,
                    message: response.message
                        ? response.message
                        : response.data,
                });

                if (response.status === 401) {
                    OnaekoAPI.auth.logout();
                } else if (
                    response.message &&
                    response.message === 'Error: Network Error'
                ) {
                    popNetwork();
                } else if (response.data) {
                    console.log(
                        `Error! Could not get talents ${response.data}`,
                    );
                }
            }
        },
        [setLoading, unsetLoading, setCollection, popNetwork],
    );

    const getTalent = useCallback(
        async (id?: string) => {
            const userId = id ? id : storage.getUserID();

            setLoading({ option: 'default' });

            const response = await OnaekoAPI.user.getTalent(userId);

            if (response.error === false) {
                setResource(GET_TALENT, response.data);
                unsetLoading({
                    option: 'default',
                    message: 'data fetched successfully',
                });
            } else {
                setResource(GET_TALENT, {});
                unsetLoading({
                    option: 'default',
                    message: response.message
                        ? response.message
                        : response.data,
                });

                if (response.status === 401) {
                    OnaekoAPI.auth.logout();
                } else if (
                    response.message &&
                    response.message === 'Error: Network Error'
                ) {
                    popNetwork();
                } else if (response.data) {
                    console.log(`Error! Could not get talent ${response.data}`);
                }
            }
        },
        [setLoading, unsetLoading, setResource, popNetwork],
    );

    const sendUsersUpdate = useCallback(
        async (data: ISendUsersUpdate) => {
            setLoading({ option: 'loader' });

            const response = await OnaekoAPI.user.sendUsersUpdate(data);

            if (response.error === false) {
                unsetLoading({ option: 'loader', message: 'successful' });
            } else {
                unsetLoading({
                    option: 'loader',
                    message: response.message
                        ? response.message
                        : response.data,
                });

                if (response.status === 401) {
                    OnaekoAPI.auth.logout();
                } else if (
                    response.message &&
                    response.message === 'Error: Network Error'
                ) {
                    popNetwork();
                } else if (response.data) {
                    console.log(
                        `Error! Could not send verification code ${response.data}`,
                    );
                }
            }

            return response;
        },
        [setLoading, unsetLoading, popNetwork],
    );

    const inviteTalent = useCallback(
        async (data: IInviteTalent) => {
            setLoading({ option: 'loader' });

            const response = await OnaekoAPI.user.inviteTalent(data);

            if (response.error === false) {
                unsetLoading({ option: 'loader', message: 'successful' });
            } else {
                unsetLoading({
                    option: 'loader',
                    message: response.message
                        ? response.message
                        : response.data,
                });

                if (response.status === 401) {
                    OnaekoAPI.auth.logout();
                } else if (
                    response.message &&
                    response.message === 'Error: Network Error'
                ) {
                    popNetwork();
                } else if (response.data) {
                    console.log(
                        `Error! Could not send invite talent ${response.data}`,
                    );
                }
            }

            return response;
        },
        [setLoading, unsetLoading, popNetwork],
    );

    return {
        users,
        user,
        talents,
        talent,
        loading,
        loader,
        items,

        getFullname,
        setItems,

        getUsers,
        getUser,
        getTalents,
        getTalent,

        sendUsersUpdate,
        inviteTalent,
    };
};

export default useUser;
