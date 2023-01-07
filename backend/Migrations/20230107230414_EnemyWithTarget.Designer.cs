﻿// <auto-generated />
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;
using Microsoft.EntityFrameworkCore.Storage.ValueConversion;

#nullable disable

namespace chacra.Migrations
{
    [DbContext(typeof(Database))]
    [Migration("20230107230414_EnemyWithTarget")]
    partial class EnemyWithTarget
    {
        /// <inheritdoc />
        protected override void BuildTargetModel(ModelBuilder modelBuilder)
        {
#pragma warning disable 612, 618
            modelBuilder.HasAnnotation("ProductVersion", "7.0.1");

            modelBuilder.Entity("CircleCollider", b =>
                {
                    b.Property<int>("Id")
                        .ValueGeneratedOnAdd()
                        .HasColumnType("INTEGER");

                    b.Property<float>("Radius")
                        .HasColumnType("REAL");

                    b.Property<float>("X")
                        .HasColumnType("REAL");

                    b.Property<float>("Y")
                        .HasColumnType("REAL");

                    b.HasKey("Id");

                    b.ToTable("CircleCollider");
                });

            modelBuilder.Entity("EnemyModel", b =>
                {
                    b.Property<int>("Id")
                        .ValueGeneratedOnAdd()
                        .HasColumnType("INTEGER");

                    b.Property<int>("ColliderId")
                        .HasColumnType("INTEGER");

                    b.Property<float>("TargetX")
                        .HasColumnType("REAL");

                    b.Property<float>("TargetY")
                        .HasColumnType("REAL");

                    b.Property<float>("X")
                        .HasColumnType("REAL");

                    b.Property<float>("Y")
                        .HasColumnType("REAL");

                    b.HasKey("Id");

                    b.HasIndex("ColliderId");

                    b.ToTable("Enemies");
                });

            modelBuilder.Entity("EnemyModel", b =>
                {
                    b.HasOne("CircleCollider", "Collider")
                        .WithMany()
                        .HasForeignKey("ColliderId")
                        .OnDelete(DeleteBehavior.Cascade)
                        .IsRequired();

                    b.Navigation("Collider");
                });
#pragma warning restore 612, 618
        }
    }
}
