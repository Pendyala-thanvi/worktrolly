/*********************************************************** 
* Copyright (C) 2022 
* Worktez 
* 
* This program is free software; you can redistribute it and/or 
* modify it under the terms of the MIT License 
* 
* 
* This program is distributed in the hope that it will be useful, 
* but WITHOUT ANY WARRANTY; without even the implied warranty of 
* MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. 
* See the MIT License for more details. 
***********************************************************/
import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { AngularFireFunctions } from '@angular/fire/compat/functions';
import { ActivatedRoute, Router } from '@angular/router';
import { Team } from 'src/app/Interface/TeamInterface';
import { BackendService } from 'src/app/services/backend/backend.service';
import { ErrorHandlerService } from 'src/app/services/error-handler/error-handler.service';
import { NavbarHandlerService } from 'src/app/services/navbar-handler/navbar-handler.service';
import { UserServiceService } from 'src/app/services/user-service/user-service.service';
import { RBAService } from 'src/app/services/RBA/rba.service';
import { marketingLabelsTempelate, developmentLabelsTempelate } from 'src/app/Interface/TeamLabelsTempelate';
import { TeamServiceService } from 'src/app/services/team/team-service.service';

@Component({
  selector: 'app-team-details',
  templateUrl: './team-details.component.html',
  styleUrls: ['./team-details.component.css']
})
export class TeamDetailsComponent implements OnInit {

  @Output() githubDetails = new EventEmitter<boolean>();
  
  ComponentName: string;
  labelName: string = "Select label";
  organizationDomain: string
  teamId: string;
  teamDataReady: boolean = false;
  componentName:string ="TEAM-DETAILS";
  team: Team;
  teamToUpdate: Team;
  updateTeamEnabled: boolean = false;
  addMemberEnabled: boolean = false;
  filteredOptionsLabels: string[] = ['Development', 'Marketing'];
  showLoader: boolean = true;
  enableLoader: boolean = false;
  type: string[]; 
  statusLabels: string[];
  priorityLabels: string[]; 
  difficultyLabels: string[]; 
  milestoneStatusLabels: string[];
  teamToAddGithub: Team;
  addProjectEnabled: boolean = false;
  typeLink: string;
  projectLinked: boolean= false;
  repoLink: string;

  constructor(private teamService: TeamServiceService, public rbaService :RBAService, private userService: UserServiceService, private backendService: BackendService, private route: ActivatedRoute, private navbarHandler: NavbarHandlerService, private functions: AngularFireFunctions,  public errorHandlerService: ErrorHandlerService, public router: Router) { }

  ngOnInit(): void {
    this.teamId = this.route.snapshot.params['teamId'];
    this.navbarHandler.addToNavbar(this.teamId);

    if(this.teamService.teamsReady) {
      this.getTeamData();
    } else {
      this.teamService.teamDataStateObservable.subscribe({
        next: (data) => {
          if(data)
            this.getTeamData();
        },
        error: (error) => {
          console.error(error);
        },
        complete: () => {
          console.log("Completed getting Team Data");
        }
      });
    }
  }

  checkGitProject(){
    if(this.team.ProjectLink!=undefined){
      if(this.team.ProjectLink==""){
        this.projectLinked=false;
      }
      else{
        this.projectLinked=true;
        this.repoLink=this.team.ProjectLink;
      }
    }
  }

  changeLabels(labelName: string) {
    if(labelName == "Marketing"){
      this.type = marketingLabelsTempelate.type;
      this.statusLabels = marketingLabelsTempelate.statusLabels;
      this.difficultyLabels = marketingLabelsTempelate.difficultyLabels;
      this.priorityLabels = marketingLabelsTempelate.priorityLabels;
      this.milestoneStatusLabels = marketingLabelsTempelate.milestoneStatusLabels
    }
    else if(labelName == "Development"){
      this.type = developmentLabelsTempelate.type;
      this.statusLabels = developmentLabelsTempelate.statusLabels;
      this.difficultyLabels = developmentLabelsTempelate.difficultyLabels;
      this.priorityLabels = developmentLabelsTempelate.priorityLabels;
      this.milestoneStatusLabels = developmentLabelsTempelate.milestoneStatusLabels;

    }
  }

  updateDefaultLabels(){
    this.showLoader = true;
    const callable = this.functions.httpsCallable('teams/createDefaultLabels');
    this.organizationDomain = this.backendService.getOrganizationDomain();
    const scope: string[] = ["Type", "Priority", "Difficulty", "Status", "MilestoneStatus"];
    callable({OrganizationDomain:this.organizationDomain, TeamName: this.team.TeamName, TypeLabels: this.type, StatusLabels: this.statusLabels, PriorityLabels: this.priorityLabels, DifficultyLabels: this.difficultyLabels, MilestoneStatusLabels: this.milestoneStatusLabels, Scope: scope}).subscribe({
      next: (data) => {
        // this.changeDefaultLabels();
        this.showLoader = false;
        this.router.navigate(['TeamDetails', this.teamId]);
        console.log("Successful ");
      },
      error: (error) => {
        this.errorHandlerService.showError = true;
        this.errorHandlerService.getErrorCode(this.componentName, "InternalError","Api");
        console.error("Error", error);
      },
      complete: () => console.info('Successful')
    });
  }

  changeDefaultLabels(item: string){
    this.labelName = item;
    if(this.labelName!=undefined){
      this.changeLabels(this.labelName);
      this.showLoader = true;
      this.organizationDomain = this.backendService.getOrganizationDomain();
      const scope: string[] = ["Type", "Priority", "Difficulty", "Status", "MilestoneStatus"];
      const callable = this.functions.httpsCallable('teams/createDefaultLabels');
      callable({OrganizationDomain: this.organizationDomain, TeamName: this.team.TeamName, Type: this.type, StatusLabels: this.statusLabels, PriorityLabels: this.priorityLabels, DifficultyLabels: this.difficultyLabels,  MilestoneStatusLabels: this.milestoneStatusLabels, Scope: scope}).subscribe({
        next: (data) => {
          this.showLoader = false;
          console.log("Successfully updated")
          this.router.navigate(['TeamDetails', this.teamId]);
          // this.updateDefaultLabels();
        },
        error: (error) => {
          console.error("Error", error);
          this.errorHandlerService.showError = true;
          this.errorHandlerService.getErrorCode(this.componentName, "InternalError","Api");
        },
        complete: () => console.info('Successful')
      });
    }
  }
  
  getTeamData() {
    this.showLoader = true;
    this.team = this.teamService.getTeamUsingId(this.teamId);
    this.team.TeamMembers.forEach((element: string) => {
      this.userService.checkAndAddToUsersUsingEmail(element);
    });
    this.userService.fetchUserData().subscribe(()=>{
      this.teamDataReady = true;
      this.showLoader = false
      this.checkGitProject();
    });
  }
  updateTeam(team: Team) {
    this.teamToUpdate = team;
    this.updateTeamEnabled = true;
  }
  addMember() {
    this.addMemberEnabled = true;
  }
  addedMember(data: { completed: boolean, memberEmail: string}) {
    this.addMemberEnabled = false;
  }

  removeMemberDB(remove: string) {
    this.enableLoader = true;
    const callable = this.functions.httpsCallable('teams/removeMember');
    if (this.organizationDomain == undefined) {
      this.organizationDomain = this.backendService.getOrganizationDomain();
    }
    
    callable({OrganizationDomain: this.organizationDomain, TeamName: this.team.TeamName, TeamMembers: this.team.TeamMembers, Remove: remove}).subscribe({
      next: (data) => {
        this.enableLoader = false;
        const index = this.team.TeamMembers.indexOf(remove);
        console.log(index);
        if (index != -1) {
          this.team.TeamMembers.splice(index, 1);
          console.log("Successfully removed member");
        } else {
          console.log("Error- Cannot remove member. Member not found");
        }
        this.teamService.getTeams(this.organizationDomain);
      },
      error: (error) => {
        this.enableLoader = false;
        this.errorHandlerService.showError = true;
        this.errorHandlerService.getErrorCode(this.componentName, "InternalError","Api");
        
      },
      complete: () => console.info('Successful ')
    });
  }

  teamUpdated(data: { completed: boolean }) {
    this.updateTeamEnabled = false;
  }
  selectedAssignee(item: any) {
    console.log(item)
  }
  
  deleteTeam() {
    this.showLoader = true
    const orgDomain = this.backendService.getOrganizationDomain();
    const callable = this.functions.httpsCallable('teams/deleteTeam');
    callable({OrganizationDomain: orgDomain, TeamName: this.team.TeamName, TeamId: this.team.TeamId}).subscribe({
      next: (data) => {
        this.team.TeamStatus = -1;
        this.showLoader = false
      },
      error: (error) => {
        console.error("Error", error);
        this.errorHandlerService.showError = true;
        this.errorHandlerService.getErrorCode(this.componentName, "InternalError","Api");
      },
      complete: () => console.info('Successful ')
    });
  }

  createDefaultLabels() {
    this.showLoader = true;
    const type: string[] = ["Bug", "Story", "Sub Task"];
    const statusLabels: string[] = ["Ice Box", "Ready to start", "Under Progress", "Blocked", "Completed"];
    const priorityLabels: string[] = ["High", "Medium", "Low"];
    const difficultyLabels: string[] = ["High", "Medium", "Low"];
    const milestoneStatusLabels: string[] = ["Ice Box", "Completed", "Under Progress", "Ready to start"];
    const scope: string[] = ["Type", "Priority", "Difficulty", "Status", "MilestoneStatus"];
    const orgDomain = this.backendService.getOrganizationDomain();
    const callable = this.functions.httpsCallable('teams/createDefaultLabels');
    console.log(orgDomain, this.team.TeamName, type, scope, difficultyLabels, milestoneStatusLabels, priorityLabels);
    callable({OrganizationDomain: orgDomain, TeamName: this.team.TeamName, Type: type, StatusLabels: statusLabels, PriorityLabels: priorityLabels, DifficultyLabels: difficultyLabels,  MilestoneStatusLabels: milestoneStatusLabels, Scope: scope}).subscribe({
      next: (data) => {
        this.showLoader = false
      },
      error: (error) => {
        console.error("Error", error);
        this.errorHandlerService.showError = true;
        this.errorHandlerService.getErrorCode(this.componentName, "InternalError","Api");
      },
      complete: () => console.info('Successful ')
  });
  }

  enableAddOrganisationLink(team: Team) {
    this.teamToAddGithub = team;
    this.addProjectEnabled = true;
    this.typeLink = "Organisation";
  }

  addedProject(data: { completed: boolean, memberEmail: string, projLink: string}) {
    this.githubDetails.emit(true);
    this.addProjectEnabled = false;
    if(data.completed==true){
    this.projectLinked=data.completed;
    this.repoLink=data.projLink;
    this.teamService.teamsDataJson[this.teamId].ProjectLink = this.repoLink;
    }
  }

  close () {
    this.router.navigate(['ViewOrganizationDetails']);
  }

}
