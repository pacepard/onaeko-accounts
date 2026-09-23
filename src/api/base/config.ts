import AxiosService from './axios';
import AuthAPI from '../core/auth';
import UserAPI from '../core/user';
import AccountAPI from '../core/account';
import StorageAPI from '../core/storage';
import WorkspaceAPI from '../core/workspace';

class APIClient {
    public auth: AuthAPI;
    public user: UserAPI;
    public account: AccountAPI;
    public storage: StorageAPI;
    public workspace: WorkspaceAPI;

    constructor() {
        const axiosService = new AxiosService();
        this.auth = new AuthAPI(axiosService);
        this.user = new UserAPI(axiosService);
        this.account = new AccountAPI(axiosService);
        this.storage = new StorageAPI(axiosService);
        this.workspace = new WorkspaceAPI(axiosService);
    }
}

/** App-wide API client. */
export const OnaekoAPI = new APIClient();
