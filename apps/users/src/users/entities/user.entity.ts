import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    Index,
} from 'typeorm';

@Entity('users')
export class User {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ unique: true, length: 50 })
    @Index()
    username: string;

    @Column({ unique: true, length: 100 })
    @Index()
    email: string;

    @Column({ name: 'password_hash', length: 255 })
    passwordHash: string;

    @Column({ name: 'display_name', length: 100, nullable: true })
    displayName: string;

    @Column({ name: 'profile_picture_url', type: 'text', nullable: true })
    profilePictureUrl: string;

    @Column({ name: 'phone_number', length: 20, nullable: true })
    phoneNumber: string;

    @Column({ name: 'is_verified', default: false })
    isVerified: boolean;

    @Column({ name: 'last_seen', type: 'timestamp', nullable: true })
    lastSeen: Date;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: Date;

    // Helper method to exclude password from responses
    toJSON() {
        const { passwordHash, ...user } = this;
        return user;
    }
}