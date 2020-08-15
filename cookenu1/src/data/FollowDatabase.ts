import knex from "knex";

export class FollowDatabase {
  private connection = knex({
    client: "mysql",
    connection: {
      host: process.env.DB_HOST,
      port: 3306,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_DATABASE_NAME,
    },
  });
  private static TABLE_NAME_USER = "User_cookenu1";
  private static TABLE_NAME_FOLLOW = "Follow_Cookenu1";
  private static COLUM_FOLLOWED_NAME = "id_followed";
  private static COLUM_USER_NAME = "id";
  
  public async createFollow(
    id_followed: string,
    id_follower: string
  ): Promise<void> {
    await this.connection
      .insert({
        id_followed,
        id_follower
      })
      .into(FollowDatabase.TABLE_NAME_FOLLOW);
  }

  public async getFollowById(id: string): Promise<any> {
    const result = await this.connection
      .select("*")
      .from(FollowDatabase.TABLE_NAME_FOLLOW)
      .where({ id });    
    return result[0];
  }


  public async isValidIdFollow(id: string): Promise<any> {
    const result = await this.connection  
      .raw(`
        SELECT COUNT(*) as quantity FROM ${FollowDatabase.TABLE_NAME_USER}
        WHERE ${FollowDatabase.COLUM_USER_NAME}="${id}"`
      );
    return result[0][0]
  }

  public async isValidIdUnfollow(id: string): Promise<any> {
    const result = await this.connection  
      .raw(`
        SELECT COUNT(*) as quantity FROM ${FollowDatabase.TABLE_NAME_FOLLOW}
        WHERE ${FollowDatabase.COLUM_FOLLOWED_NAME}="${id}"`
      );
    return result[0][0]
  }

  public async deleteFollow(id_followed: string, id_follower: string): Promise<any> {
    try{
      await this.connection
      .delete()
      .from(FollowDatabase.TABLE_NAME_FOLLOW)
      .where({ id_followed, id_follower });
    }catch(err){
      throw new Error(err.sqlMessage || err.message)
    }
  }
}
